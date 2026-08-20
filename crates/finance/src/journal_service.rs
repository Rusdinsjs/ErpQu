use crate::domain::entities::gl_entry::{PostingInstruction, PostingLineItem};
use crate::domain::entities::journal::{
    CreateJournalEntryRequest, CreateJournalLineRequest, JournalEntry, JournalEntryDetail,
    JournalStatus,
};
use crate::posting_engine::AccountingPostingEngine;
use crate::repositories::{FinanceRepository, JournalRepository};
use management_system_core::domain::errors::{DomainError, DomainResult};
use management_system_core::infrastructure::database::UnitOfWork;
use uuid::Uuid;

#[derive(Clone)]
pub struct JournalService {
    journal_repo: JournalRepository,
    finance_repo: FinanceRepository,
    posting_engine: Option<AccountingPostingEngine>,
}

impl JournalService {
    pub fn new(journal_repo: JournalRepository, finance_repo: FinanceRepository) -> Self {
        Self {
            journal_repo,
            finance_repo,
            posting_engine: None,
        }
    }

    pub fn with_posting_engine(
        journal_repo: JournalRepository,
        finance_repo: FinanceRepository,
        posting_engine: AccountingPostingEngine,
    ) -> Self {
        Self {
            journal_repo,
            finance_repo,
            posting_engine: Some(posting_engine),
        }
    }

    pub fn pool(&self) -> &sqlx::PgPool {
        self.journal_repo.pool()
    }

    pub async fn create_journal_entry(
        &self,
        transaction_number: String,
        req: CreateJournalEntryRequest,
        created_by: Option<Uuid>,
    ) -> DomainResult<JournalEntryDetail> {
        // Validate debits == credits (QACC-004)
        let total_debit: rust_decimal::Decimal = req.lines.iter().map(|l| l.debit).sum();
        let total_credit: rust_decimal::Decimal = req.lines.iter().map(|l| l.credit).sum();

        if total_debit != total_credit {
            return Err(DomainError::business_rule(
                "UnbalancedJournalEntry",
                &format!(
                    "Total debit ({}) must equal total credit ({})",
                    total_debit, total_credit
                ),
            ));
        }

        if req.lines.is_empty() {
            return Err(DomainError::business_rule(
                "EmptyJournalEntry",
                "Journal entry must contain at least one line",
            ));
        }

        // Validate accounts exist
        for line in &req.lines {
            if self
                .finance_repo
                .find_by_id(line.account_id)
                .await?
                .is_none()
            {
                return Err(DomainError::not_found("ChartOfAccount", line.account_id));
            }
        }

        self.journal_repo
            .create_journal_entry(transaction_number, &req, created_by)
            .await
    }

    pub async fn get_journal_entry_detail(
        &self,
        id: Uuid,
    ) -> DomainResult<Option<JournalEntryDetail>> {
        self.journal_repo.get_journal_entry_detail(id).await
    }

    pub async fn list_journal_entries(&self) -> DomainResult<Vec<JournalEntry>> {
        self.journal_repo.list_journal_entries().await
    }

    pub async fn submit_journal_entry(&self, id: Uuid) -> DomainResult<()> {
        let entry = self
            .journal_repo
            .get_journal_entry_detail(id)
            .await?
            .ok_or_else(|| DomainError::not_found("JournalEntry", id))?;

        if entry.header.status != JournalStatus::Draft {
            return Err(DomainError::business_rule(
                "InvalidState",
                "Only Draft journal entries can be submitted",
            ));
        }

        self.journal_repo
            .update_status(id, JournalStatus::Submitted)
            .await
    }

    pub async fn approve_journal_entry(&self, id: Uuid, approver_id: Uuid) -> DomainResult<()> {
        let entry = self
            .journal_repo
            .get_journal_entry_detail(id)
            .await?
            .ok_or_else(|| DomainError::not_found("JournalEntry", id))?;

        if let Some(creator) = entry.header.created_by {
            management_system_core::domain::sod::SodValidator::validate_journal_posting(
                creator,
                approver_id,
            )?;
        }

        if entry.header.status != JournalStatus::Submitted {
            return Err(DomainError::business_rule(
                "InvalidState",
                "Only Submitted journal entries can be approved",
            ));
        }

        self.journal_repo
            .update_status(id, JournalStatus::Approved)
            .await
    }

    pub async fn post_journal_entry(
        &self,
        id: Uuid,
        company_id: Uuid,
        poster_id: Option<Uuid>,
    ) -> DomainResult<()> {
        let entry = self
            .journal_repo
            .get_journal_entry_detail(id)
            .await?
            .ok_or_else(|| DomainError::not_found("JournalEntry", id))?;

        // Enforce Maker != Checker SoD
        if let (Some(creator), Some(poster)) = (entry.header.created_by, poster_id) {
            management_system_core::domain::sod::SodValidator::validate_journal_posting(
                creator, poster,
            )?;
        }

        if entry.header.status == JournalStatus::Posted {
            return Err(DomainError::business_rule(
                "AlreadyPosted",
                "Journal entry is already in Posted status",
            ));
        }

        // Re-validate debits == credits before posting
        let total_debit: rust_decimal::Decimal = entry.lines.iter().map(|l| l.debit).sum();
        let total_credit: rust_decimal::Decimal = entry.lines.iter().map(|l| l.credit).sum();

        if total_debit != total_credit {
            return Err(DomainError::business_rule(
                "UnbalancedJournalEntry",
                &format!(
                    "Cannot post unbalanced journal entry: debit ({}) != credit ({})",
                    total_debit, total_credit
                ),
            ));
        }

        let effective_company_id = entry.header.company_id.unwrap_or(company_id);

        let engine = self.posting_engine.as_ref().ok_or_else(|| {
            DomainError::business_rule(
                "MissingPostingEngine",
                "Mandatory AccountingPostingEngine is not initialized",
            )
        })?;

        let instruction = PostingInstruction {
            company_id: effective_company_id,
            posting_date: entry.header.date,
            voucher_type: "JOURNAL_ENTRY".to_string(),
            voucher_no: entry.header.transaction_number.clone(),
            voucher_id: entry.header.id,
            lines: entry
                .lines
                .iter()
                .map(|l| PostingLineItem {
                    account_id: l.account_id,
                    debit: l.debit,
                    credit: l.credit,
                    party_type: None,
                    party_id: None,
                    cost_center_id: None,
                    project_id: None,
                    currency: Some("IDR".to_string()),
                    exchange_rate: Some(rust_decimal::Decimal::from(1)),
                })
                .collect(),
            created_by: poster_id.or(entry.header.created_by),
        };

        let mut uow = UnitOfWork::begin(self.journal_repo.pool()).await?;
        engine.post_in_uow(uow.tx(), &instruction).await?;
        JournalRepository::update_status_in_uow(&mut uow, id, JournalStatus::Posted).await?;
        uow.commit().await?;

        Ok(())
    }

    /// Reversal Voucher (Point A.9, A.10): Creates an explicit Reversal Voucher referencing original journal
    pub async fn reverse_journal_entry(
        &self,
        id: Uuid,
        company_id: Uuid,
        reason: String,
        reversed_by: Option<Uuid>,
    ) -> DomainResult<JournalEntryDetail> {
        let original_entry = self
            .journal_repo
            .get_journal_entry_detail(id)
            .await?
            .ok_or_else(|| DomainError::not_found("JournalEntry", id))?;

        if original_entry.header.status != JournalStatus::Posted {
            return Err(DomainError::business_rule(
                "InvalidReversalState",
                "Only Posted journal entries can be reversed",
            ));
        }

        let effective_company_id = original_entry.header.company_id.unwrap_or(company_id);
        let engine = self.posting_engine.as_ref().ok_or_else(|| {
            DomainError::business_rule(
                "MissingPostingEngine",
                "Mandatory AccountingPostingEngine is not initialized",
            )
        })?;

        let mut uow = UnitOfWork::begin(self.journal_repo.pool()).await?;

        // 1. Post exact GL Reversal inside UoW (Fail-Closed)
        let reversal_date = chrono::Utc::now().date_naive();
        engine
            .reverse_voucher_in_uow(
                uow.tx(),
                effective_company_id,
                "JOURNAL_ENTRY",
                id,
                reversal_date,
                reversed_by,
            )
            .await?;

        // 2. Create Reversal Journal Voucher
        let reversal_seq = format!("REV-{}", original_entry.header.transaction_number);
        let reversal_req = CreateJournalEntryRequest {
            company_id: Some(effective_company_id),
            date: reversal_date,
            description: format!(
                "Reversal of {}: {}",
                original_entry.header.transaction_number, reason
            ),
            reference: Some(original_entry.header.transaction_number.clone()),
            lines: original_entry
                .lines
                .iter()
                .map(|l| CreateJournalLineRequest {
                    account_id: l.account_id,
                    description: Some(format!(
                        "Reversal of {}",
                        l.description.as_deref().unwrap_or("")
                    )),
                    debit: l.credit,
                    credit: l.debit,
                })
                .collect(),
        };

        let reversal_detail = JournalRepository::create_journal_entry_with_uow(
            &mut uow,
            reversal_seq,
            &reversal_req,
            reversed_by,
        )
        .await?;

        // Mark reversal voucher as Posted and original voucher as Reversed
        JournalRepository::update_status_in_uow(
            &mut uow,
            reversal_detail.header.id,
            JournalStatus::Posted,
        )
        .await?;
        JournalRepository::record_reversal_in_uow(
            &mut uow,
            id,
            reversal_detail.header.id,
            &reason,
            reversed_by,
        )
        .await?;

        uow.commit().await?;

        tracing::info!(
            "SECURITY AUDIT JOURNAL_REVERSED: OriginalID={} ReversalID={} Reason={}",
            id,
            reversal_detail.header.id,
            reason
        );

        Ok(reversal_detail)
    }

    pub async fn cancel_journal_entry(&self, id: Uuid) -> DomainResult<()> {
        let entry = self
            .journal_repo
            .get_journal_entry_detail(id)
            .await?
            .ok_or_else(|| DomainError::not_found("JournalEntry", id))?;

        if entry.header.status == JournalStatus::Posted {
            return Err(DomainError::business_rule(
                "CannotCancelPosted",
                "Posted journal entries cannot be cancelled directly. Use Reversal instead.",
            ));
        }

        self.journal_repo
            .update_status(id, JournalStatus::Cancelled)
            .await
    }
}
