use chrono::{Datelike, Utc};
use serde::Serialize;
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::domain::entities::*;
use crate::repositories::{FinanceRepository, JournalRepository};
use crate::AssetExpenseService;
use crate::JournalService;

use management_system_assets::AssetRepository;
use management_system_core::domain::audit_trail::{AuditAction, DocumentAuditEntry};
use management_system_core::domain::errors::{DomainError, DomainResult};
use management_system_core::domain::outbox::OutboxEntry;
use management_system_core::infrastructure::bus::EventBus;
use management_system_core::infrastructure::database::{
    CommandContext, IdempotencyDecision, IdempotencyStore, UnitOfWork,
};
use management_system_core::infrastructure::repositories::{AuditTrailStore, OutboxStore};

#[derive(Clone)]
#[allow(dead_code)] // Fields retained for future use (dependency injection)
pub struct FinanceService {
    repo: FinanceRepository,
    journal_repo: JournalRepository,
    journal_service: JournalService,
    asset_expense_service: AssetExpenseService,
    asset_repo: AssetRepository,

    event_bus: EventBus,
    accounting_engine: Option<crate::posting_engine::AccountingPostingEngine>,
}

impl FinanceService {
    fn request_fingerprint<T: Serialize>(
        action: &str,
        source_id: Option<Uuid>,
        payload: &T,
    ) -> DomainResult<String> {
        let payload = serde_json::to_vec(payload)
            .map_err(|e| DomainError::validation("payload", &e.to_string()))?;
        let mut hasher = Sha256::new();
        hasher.update(action.as_bytes());
        hasher.update([0]);
        if let Some(source_id) = source_id {
            hasher.update(source_id.as_bytes());
        }
        hasher.update([0]);
        hasher.update(payload);
        Ok(format!("{:x}", hasher.finalize()))
    }

    pub fn new(
        repo: FinanceRepository,
        journal_repo: JournalRepository,
        journal_service: JournalService,
        asset_expense_service: AssetExpenseService,
        asset_repo: AssetRepository,

        event_bus: EventBus,
    ) -> Self {
        Self {
            repo,
            journal_repo,
            journal_service,
            asset_expense_service,
            asset_repo,

            event_bus,
            accounting_engine: None,
        }
    }

    pub fn with_accounting_engine(
        mut self,
        accounting_engine: crate::posting_engine::AccountingPostingEngine,
    ) -> Self {
        self.accounting_engine = Some(accounting_engine);
        self
    }

    pub async fn allocate_payment(
        &self,
        req: AllocatePaymentRequest,
    ) -> DomainResult<PaymentAllocation> {
        if req.allocated_amount <= rust_decimal::Decimal::ZERO {
            return Err(DomainError::business_rule(
                "InvalidAllocationAmount",
                "Allocated amount must be greater than 0",
            ));
        }

        if req.invoice_type == "SALES_INVOICE" {
            let invoice_opt = self.repo.get_sales_invoice_by_id(req.invoice_id).await?;
            let invoice = invoice_opt.ok_or_else(|| {
                DomainError::not_found("SalesInvoice", &req.invoice_id.to_string())
            })?;

            let new_amount_paid = invoice.amount_paid + req.allocated_amount;
            if new_amount_paid > invoice.total_amount {
                return Err(DomainError::business_rule(
                    "AllocationExceedsBalance",
                    "Allocated amount exceeds remaining balance",
                ));
            }

            let new_status = if new_amount_paid >= invoice.total_amount {
                "paid"
            } else if new_amount_paid > rust_decimal::Decimal::ZERO {
                "partially_paid"
            } else {
                &invoice.status
            };

            self.repo
                .update_sales_invoice_payment_status(req.invoice_id, new_amount_paid, new_status)
                .await?;
        } else if req.invoice_type == "PURCHASE_BILL" {
            let bill_opt = self.repo.get_purchase_bill_by_id(req.invoice_id).await?;
            let bill = bill_opt.ok_or_else(|| {
                DomainError::not_found("PurchaseBill", &req.invoice_id.to_string())
            })?;

            let new_amount_paid = bill.amount_paid + req.allocated_amount;
            if new_amount_paid > bill.total_amount {
                return Err(DomainError::business_rule(
                    "AllocationExceedsBalance",
                    "Allocated amount exceeds remaining balance",
                ));
            }

            let new_status = if new_amount_paid >= bill.total_amount {
                "paid"
            } else if new_amount_paid > rust_decimal::Decimal::ZERO {
                "partially_paid"
            } else {
                &bill.status
            };

            self.repo
                .update_purchase_bill_payment_status(req.invoice_id, new_amount_paid, new_status)
                .await?;
        } else {
            return Err(DomainError::validation(
                "invoice_type",
                "Invalid invoice type",
            ));
        }

        let allocation = PaymentAllocation {
            id: Uuid::new_v4(),
            company_id: req.company_id,
            payment_entry_id: req.payment_entry_id,
            invoice_type: req.invoice_type,
            invoice_id: req.invoice_id,
            allocated_amount: req.allocated_amount,
            created_by: req.created_by,
            created_at: Utc::now(),
        };

        self.repo.create_payment_allocation(&allocation).await
    }

    /// Financial Report Provider: Trial Balance (QRPT-003)
    pub async fn get_trial_balance_report(
        &self,
        company_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<TrialBalanceEntry>> {
        self.repo
            .get_trial_balance(company_id, start_date, end_date)
            .await
    }

    // --- Chart of Accounts Management ---

    pub async fn list_accounts(&self, company_id: Uuid) -> DomainResult<Vec<ChartOfAccount>> {
        self.repo.list_accounts(company_id).await
    }

    pub async fn get_account_tree(&self, company_id: Uuid) -> DomainResult<Vec<AccountTreeNode>> {
        let accounts = self.repo.list_accounts(company_id).await?;
        let gl_entries = self.repo.get_trial_balance(company_id, None, None).await?;

        let mut balance_map = std::collections::HashMap::new();
        for entry in gl_entries {
            balance_map.insert(entry.account_id, entry.debit - entry.credit);
        }

        fn build_node(
            account: &ChartOfAccount,
            all_accounts: &[ChartOfAccount],
            balance_map: &std::collections::HashMap<Uuid, rust_decimal::Decimal>,
        ) -> AccountTreeNode {
            let children: Vec<AccountTreeNode> = all_accounts
                .iter()
                .filter(|a| a.parent_id == Some(account.id))
                .map(|a| build_node(a, all_accounts, balance_map))
                .collect();

            let own_balance = balance_map.get(&account.id).copied().unwrap_or_default();
            let children_balance: rust_decimal::Decimal = children.iter().map(|c| c.balance).sum();

            AccountTreeNode {
                id: account.id,
                code: account.code.clone(),
                name: account.name.clone(),
                account_type: account.account_type,
                normal_balance: account.normal_balance,
                balance: own_balance + children_balance,
                currency: account.currency.clone(),
                children,
            }
        }

        let root_accounts: Vec<&ChartOfAccount> =
            accounts.iter().filter(|a| a.parent_id.is_none()).collect();

        Ok(root_accounts
            .into_iter()
            .map(|a| build_node(a, &accounts, &balance_map))
            .collect())
    }

    pub async fn get_account(&self, id: Uuid) -> DomainResult<ChartOfAccount> {
        self.repo
            .get_account_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("ChartOfAccount", id))
    }

    pub async fn find_by_code(
        &self,
        code: &str,
        company_id: Option<Uuid>,
    ) -> DomainResult<Option<ChartOfAccount>> {
        self.repo.find_by_code(code, company_id).await
    }

    pub async fn resolve_account(
        &self,
        company_id: Uuid,
        mapping_key: &str,
    ) -> DomainResult<Option<ChartOfAccount>> {
        self.repo
            .get_account_by_mapping(company_id, mapping_key)
            .await
    }

    pub async fn upsert_account_mapping(
        &self,
        company_id: Uuid,
        mapping_key: &str,
        account_id: Uuid,
        description: Option<&str>,
    ) -> DomainResult<()> {
        self.repo
            .upsert_account_mapping(company_id, mapping_key, account_id, description)
            .await
    }

    pub async fn create_account(&self, req: CreateAccountRequest) -> DomainResult<ChartOfAccount> {
        if self
            .repo
            .find_by_code(&req.code, req.company_id)
            .await?
            .is_some()
        {
            return Err(DomainError::business_rule(
                "DuplicateAccountCode",
                &format!("Account code '{}' already exists", req.code),
            ));
        }

        let now = Utc::now();
        let account = ChartOfAccount {
            id: Uuid::new_v4(),
            company_id: req.company_id,
            code: req.code,
            name: req.name,
            account_type: req.account_type,
            normal_balance: req.normal_balance,
            parent_id: req.parent_id,
            is_active: true,
            description: req.description,
            currency: req.currency.unwrap_or_else(|| "IDR".to_string()),
            created_at: now,
            updated_at: now,
        };

        self.repo.create_account(&account).await
    }

    pub async fn update_account(
        &self,
        id: Uuid,
        req: UpdateAccountRequest,
    ) -> DomainResult<ChartOfAccount> {
        let mut account = self
            .repo
            .get_account_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("ChartOfAccount", id))?;

        if let Some(name) = req.name {
            account.name = name;
        }
        if let Some(parent_id) = req.parent_id {
            account.parent_id = Some(parent_id);
        }
        if let Some(is_active) = req.is_active {
            account.is_active = is_active;
        }
        if let Some(desc) = req.description {
            account.description = Some(desc);
        }

        self.repo.update_account(&account).await
    }

    pub async fn delete_account(&self, _id: Uuid) -> DomainResult<()> {
        Ok(())
    }

    // --- Reporting ---

    pub async fn get_general_ledger(
        &self,
        account_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<GeneralLedgerEntry>> {
        self.repo
            .get_general_ledger(account_id, start_date, end_date)
            .await
    }

    pub async fn get_trial_balance(
        &self,
        company_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<TrialBalanceEntry>> {
        self.repo
            .get_trial_balance(company_id, start_date, end_date)
            .await
    }

    pub async fn get_income_statement(
        &self,
        company_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<FinancialReportEntry>> {
        let trial_balance = self
            .repo
            .get_trial_balance(company_id, start_date, end_date)
            .await?;

        let mut report = Vec::new();
        for entry in trial_balance {
            if entry.account_type == AccountType::Revenue {
                report.push(FinancialReportEntry {
                    account_code: entry.account_code,
                    account_name: entry.account_name,
                    balance: entry.credit - entry.debit,
                });
            } else if entry.account_type == AccountType::Expense {
                report.push(FinancialReportEntry {
                    account_code: entry.account_code,
                    account_name: entry.account_name,
                    balance: entry.debit - entry.credit,
                });
            }
        }

        Ok(report)
    }

    pub async fn get_balance_sheet(
        &self,
        company_id: Uuid,
        as_of_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<FinancialReportEntry>> {
        let trial_balance = self
            .repo
            .get_trial_balance(company_id, None, as_of_date)
            .await?;

        let mut report = Vec::new();
        for entry in trial_balance {
            match entry.account_type {
                AccountType::Asset => {
                    report.push(FinancialReportEntry {
                        account_code: entry.account_code,
                        account_name: entry.account_name,
                        balance: entry.debit - entry.credit,
                    });
                }
                AccountType::Liability | AccountType::Equity => {
                    report.push(FinancialReportEntry {
                        account_code: entry.account_code,
                        account_name: entry.account_name,
                        balance: entry.credit - entry.debit,
                    });
                }
                _ => {}
            }
        }

        Ok(report)
    }

    pub async fn get_capex_opex_analysis(
        &self,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<ExpenseAnalysis>> {
        self.repo
            .get_capex_opex_analysis(start_date, end_date)
            .await
    }

    // --- Sales Invoice Management (3R.1.1-004 & 3R.1.1-005) ---

    pub async fn list_sales_invoices(&self) -> DomainResult<Vec<SalesInvoice>> {
        let invoices = self.repo.list_sales_invoices().await?;
        let mut enriched = Vec::with_capacity(invoices.len());
        for invoice in invoices {
            enriched.push(self.enrich_invoice_journal_status(invoice).await?);
        }
        Ok(enriched)
    }

    pub async fn create_sales_invoice(
        &self,
        actor_id: Uuid,
        company_id: Uuid,
        idempotency_key: String,
        req: CreateSalesInvoiceRequest,
    ) -> DomainResult<SalesInvoice> {
        if req.items.is_empty() {
            return Err(DomainError::validation(
                "items",
                "Sales invoice requires at least one line item",
            ));
        }

        let request_fingerprint = Self::request_fingerprint("CREATE_SALES_INVOICE", None, &req)?;

        let total: rust_decimal::Decimal =
            req.items.iter().map(|i| i.quantity * i.unit_price).sum();
        let tax_rate = req.tax_rate.unwrap_or(rust_decimal::Decimal::new(11, 2)); // Default 11% PPN Indonesia
        let tax = (total * tax_rate).round_dp(2);

        let invoice_id = Uuid::new_v4();
        let invoice = SalesInvoice {
            id: invoice_id,
            invoice_number: req.invoice_number.clone(),
            client_id: req.client_id,
            date: req.date,
            due_date: req.due_date,
            subject: req.subject.clone(),
            subtotal: total,
            tax,
            total_amount: total + tax,
            amount_paid: rust_decimal::Decimal::ZERO,
            status: "draft".to_string(),
            journal_entry_id: None,
            journal_status: None,
            created_at: Utc::now(),
            attachment_url: req.attachment_url,
            company_id: Some(company_id),
        };

        // 1. Find Accounts (Piutang & Penjualan & VAT Output) via Account Mapping (QSEC-ACMAP-001)
        let receivable_acc = self
            .resolve_account(company_id, mapping_keys::ACCOUNTS_RECEIVABLE)
            .await?
            .or(self.find_by_code("1-1300", Some(company_id)).await?)
            .or(self.find_by_code("1-1300", None).await?)
            .ok_or_else(|| {
                DomainError::business_rule(
                    "Missing Account",
                    "Account for Accounts Receivable (Piutang Usaha) not configured or found",
                )
            })?;
        let sales_acc = self
            .resolve_account(company_id, mapping_keys::SALES_REVENUE)
            .await?
            .or(self.find_by_code("4-1100", Some(company_id)).await?)
            .or(self.find_by_code("4-1100", None).await?)
            .ok_or_else(|| {
                DomainError::business_rule(
                    "Missing Account",
                    "Account for Sales Revenue (Pendapatan Penjualan) not configured or found",
                )
            })?;
        let vat_out_acc = self
            .resolve_account(company_id, mapping_keys::VAT_OUTPUT)
            .await?
            .or(self.find_by_code("2-1500", Some(company_id)).await?)
            .or(self.find_by_code("2-1500", None).await?)
            .or(self.find_by_code("21500", Some(company_id)).await?)
            .or(self.find_by_code("21500", None).await?);

        // 2. Begin UnitOfWork transaction boundary (3R.1.1-004 & 3R.1.1-005)
        let mut uow = UnitOfWork::begin(self.repo.pool()).await?;

        // 3. Idempotency Check & Reservation
        let cmd_ctx = CommandContext::new(
            actor_id,
            company_id,
            "SALES_INVOICE",
            invoice_id,
            "CREATE_SALES_INVOICE",
            &idempotency_key,
            request_fingerprint,
        );

        if let IdempotencyDecision::Completed { outcome } =
            IdempotencyStore::check_and_reserve(&mut uow, &cmd_ctx).await?
        {
            uow.rollback().await?;
            return serde_json::from_str(&outcome).map_err(|e| {
                DomainError::internal(format!("Invalid cached idempotency outcome: {e}"))
            });
        }

        // 4. Persist Sales Invoice Header AND Lines atomically
        let (mut created_invoice, _created_items) = self
            .repo
            .create_sales_invoice_with_uow(&mut uow, &invoice, &req.items)
            .await?;

        // 5. Create Draft Journal Entry in the SAME UnitOfWork
        let mut journal_lines = vec![
            CreateJournalLineRequest {
                account_id: receivable_acc.id,
                description: Some(format!(
                    "Piutang Penjualan {}",
                    created_invoice.invoice_number
                )),
                debit: total + tax,
                credit: rust_decimal::Decimal::ZERO,
            },
            CreateJournalLineRequest {
                account_id: sales_acc.id,
                description: Some(format!(
                    "Pendapatan Penjualan {}",
                    created_invoice.invoice_number
                )),
                debit: rust_decimal::Decimal::ZERO,
                credit: total,
            },
        ];

        if tax > rust_decimal::Decimal::ZERO {
            if let Some(vat_acc) = vat_out_acc {
                journal_lines.push(CreateJournalLineRequest {
                    account_id: vat_acc.id,
                    description: Some(format!("PPN Keluaran {}", created_invoice.invoice_number)),
                    debit: rust_decimal::Decimal::ZERO,
                    credit: tax,
                });
            } else {
                journal_lines[1].credit = total + tax;
            }
        }

        let journal_req = CreateJournalEntryRequest {
            company_id: Some(company_id),
            date: created_invoice.date,
            description: format!(
                "Penjualan: {} - {}",
                created_invoice.invoice_number,
                created_invoice.subject.as_deref().unwrap_or("-")
            ),
            reference: Some(created_invoice.invoice_number.clone()),
            lines: journal_lines,
        };

        let journal = JournalRepository::create_journal_entry_with_uow(
            &mut uow,
            format!("TX-{}", created_invoice.invoice_number),
            &journal_req,
            Some(actor_id),
        )
        .await?;

        // Link journal entry id inside UoW
        sqlx::query("UPDATE sales_invoices SET journal_entry_id = $1 WHERE id = $2")
            .bind(journal.header.id)
            .bind(created_invoice.id)
            .execute(uow.conn())
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        created_invoice.journal_entry_id = Some(journal.header.id);
        created_invoice.journal_status = Some(journal.header.status);

        // 6. Append Audit Entry in SAME UoW (3R.1.1-005)
        let audit_entry = DocumentAuditEntry {
            id: Uuid::new_v4(),
            document_id: created_invoice.id,
            document_type: "SALES_INVOICE".to_string(),
            action: AuditAction::Create.as_str().to_string(),
            actor_id,
            tenant_id: company_id,
            company_id: Some(company_id),
            from_status: None,
            to_status: Some("draft".to_string()),
            document_version: 1,
            reason: Some("Sales invoice created".to_string()),
            correlation_id: cmd_ctx.correlation_id.clone(),
            recorded_at: Utc::now(),
        };
        AuditTrailStore::append(&mut uow, &audit_entry).await?;

        // 7. Append Outbox Entry in SAME UoW (3R.1.1-005)
        let outbox_payload = serde_json::to_value(&created_invoice)
            .map_err(|e| DomainError::validation("payload", &e.to_string()))?;
        let outbox_entry = OutboxEntry::new(
            "SALES_INVOICE_CREATED",
            &outbox_payload,
            "SALES_INVOICE",
            created_invoice.id,
            company_id,
            Some(company_id),
            cmd_ctx.correlation_id.clone(),
        );
        OutboxStore::append(&mut uow, &outbox_entry).await?;

        // 8. Mark Idempotency Complete
        IdempotencyStore::mark_complete(
            &mut uow,
            &cmd_ctx,
            &serde_json::to_string(&created_invoice).unwrap_or_default(),
        )
        .await?;

        // 9. Commit entire transaction boundary
        uow.commit().await?;

        Ok(created_invoice)
    }

    pub async fn get_sales_invoice(&self, id: Uuid) -> DomainResult<SalesInvoice> {
        let invoice = self
            .repo
            .get_sales_invoice_by_id(id)
            .await?
            .ok_or_else(|| DomainError::not_found("SalesInvoice", id))?;
        self.enrich_invoice_journal_status(invoice).await
    }

    async fn enrich_invoice_journal_status(
        &self,
        mut invoice: SalesInvoice,
    ) -> DomainResult<SalesInvoice> {
        invoice.journal_status = match invoice.journal_entry_id {
            Some(journal_id) => self
                .journal_repo
                .get_journal_entry_detail(journal_id)
                .await?
                .map(|detail| detail.header.status),
            None => None,
        };
        Ok(invoice)
    }

    pub async fn get_sales_invoice_detail(
        &self,
        id: Uuid,
    ) -> DomainResult<SalesInvoiceDetailResponse> {
        let invoice = self.get_sales_invoice(id).await?;
        let items = self.repo.get_sales_invoice_items(id).await?;
        Ok(SalesInvoiceDetailResponse { invoice, items })
    }

    pub async fn update_sales_invoice(
        &self,
        actor_id: Uuid,
        company_id: Uuid,
        idempotency_key: String,
        id: Uuid,
        req: CreateSalesInvoiceRequest,
    ) -> DomainResult<SalesInvoice> {
        if req.items.is_empty() {
            return Err(DomainError::validation(
                "items",
                "Sales invoice requires at least one line item",
            ));
        }

        let request_fingerprint =
            Self::request_fingerprint("UPDATE_SALES_INVOICE", Some(id), &req)?;

        let mut invoice = self.get_sales_invoice(id).await?;
        if invoice.journal_status == Some(JournalStatus::Posted) {
            return Err(DomainError::business_rule(
                "PostedJournalIsImmutable",
                "Cannot edit a sales invoice whose journal is already posted",
            ));
        }
        let total: rust_decimal::Decimal =
            req.items.iter().map(|i| i.quantity * i.unit_price).sum();

        invoice.invoice_number = req.invoice_number;
        invoice.client_id = req.client_id;
        invoice.date = req.date;
        invoice.due_date = req.due_date;
        invoice.subject = req.subject;
        invoice.subtotal = total;
        invoice.total_amount = total;
        invoice.attachment_url = req.attachment_url;

        // 1. Begin UnitOfWork transaction boundary (3R.1.1-004 & 3R.1.1-005)
        let mut uow = UnitOfWork::begin(self.repo.pool()).await?;

        // 2. Idempotency Check & Reservation
        let cmd_ctx = CommandContext::new(
            actor_id,
            company_id,
            "SALES_INVOICE",
            id,
            "UPDATE_SALES_INVOICE",
            &idempotency_key,
            request_fingerprint,
        );

        if let IdempotencyDecision::Completed { outcome } =
            IdempotencyStore::check_and_reserve(&mut uow, &cmd_ctx).await?
        {
            uow.rollback().await?;
            return serde_json::from_str(&outcome).map_err(|e| {
                DomainError::internal(format!("Invalid cached idempotency outcome: {e}"))
            });
        }

        // 3. Update Invoice Header + Lines in UoW
        let (mut updated_invoice, _updated_items) = self
            .repo
            .update_sales_invoice_with_uow(&mut uow, &invoice, &req.items)
            .await?;
        updated_invoice.journal_status = invoice.journal_status;

        if let Some(journal_id) = updated_invoice.journal_entry_id {
            let company_id = updated_invoice.company_id.unwrap_or(company_id);
            let receivable_acc = self
                .resolve_account(company_id, mapping_keys::ACCOUNTS_RECEIVABLE)
                .await?
                .or(self.find_by_code("1-1300", Some(company_id)).await?)
                .or(self.find_by_code("1-1300", None).await?)
                .ok_or_else(|| {
                    DomainError::business_rule(
                        "Missing Account",
                        "Account for Accounts Receivable not configured or found",
                    )
                })?;
            let sales_acc = self
                .resolve_account(company_id, mapping_keys::SALES_REVENUE)
                .await?
                .or(self.find_by_code("4-1100", Some(company_id)).await?)
                .or(self.find_by_code("4-1100", None).await?)
                .ok_or_else(|| {
                    DomainError::business_rule(
                        "Missing Account",
                        "Account for Sales Revenue not configured or found",
                    )
                })?;

            let journal_req = CreateJournalEntryRequest {
                company_id: Some(company_id),
                date: updated_invoice.date,
                description: format!(
                    "Penjualan: {} - {}",
                    updated_invoice.invoice_number,
                    updated_invoice.subject.as_deref().unwrap_or("-")
                ),
                reference: Some(updated_invoice.invoice_number.clone()),
                lines: vec![
                    CreateJournalLineRequest {
                        account_id: receivable_acc.id,
                        description: Some(format!(
                            "Piutang Penjualan {}",
                            updated_invoice.invoice_number
                        )),
                        debit: total,
                        credit: rust_decimal::Decimal::ZERO,
                    },
                    CreateJournalLineRequest {
                        account_id: sales_acc.id,
                        description: Some(format!(
                            "Pendapatan Penjualan {}",
                            updated_invoice.invoice_number
                        )),
                        debit: rust_decimal::Decimal::ZERO,
                        credit: total,
                    },
                ],
            };

            let updated_journal = JournalRepository::update_journal_entry_with_uow(
                &mut uow,
                journal_id,
                &journal_req,
            )
            .await?;
            updated_invoice.journal_status = Some(updated_journal.header.status);
        }

        // 5. Append Audit Entry in SAME UoW (3R.1.1-005)
        let audit_entry = DocumentAuditEntry {
            id: Uuid::new_v4(),
            document_id: updated_invoice.id,
            document_type: "SALES_INVOICE".to_string(),
            action: AuditAction::Update.as_str().to_string(),
            actor_id,
            tenant_id: company_id,
            company_id: Some(company_id),
            from_status: Some("draft".to_string()),
            to_status: Some("draft".to_string()),
            document_version: 2,
            reason: Some("Sales invoice updated".to_string()),
            correlation_id: cmd_ctx.correlation_id.clone(),
            recorded_at: Utc::now(),
        };
        AuditTrailStore::append(&mut uow, &audit_entry).await?;

        // 6. Append Outbox Entry in SAME UoW (3R.1.1-005)
        let outbox_payload = serde_json::to_value(&updated_invoice)
            .map_err(|e| DomainError::validation("payload", &e.to_string()))?;
        let outbox_entry = OutboxEntry::new(
            "SALES_INVOICE_UPDATED",
            &outbox_payload,
            "SALES_INVOICE",
            updated_invoice.id,
            company_id,
            Some(company_id),
            cmd_ctx.correlation_id.clone(),
        );
        OutboxStore::append(&mut uow, &outbox_entry).await?;

        // 7. Mark Idempotency Complete
        IdempotencyStore::mark_complete(
            &mut uow,
            &cmd_ctx,
            &serde_json::to_string(&updated_invoice).unwrap_or_default(),
        )
        .await?;

        // 8. Commit UoW
        uow.commit().await?;

        Ok(updated_invoice)
    }

    pub async fn delete_sales_invoice(&self, id: Uuid) -> DomainResult<()> {
        let invoice = self.get_sales_invoice_detail(id).await?;
        let status = invoice.invoice.status.to_lowercase();
        if status == "posted" || status == "submitted" {
            return Err(DomainError::business_rule(
                "ImmutablePostedDocument",
                "Posted or submitted sales invoices cannot be deleted. You must cancel or reverse the document instead.",
            ));
        }
        self.repo.delete_sales_invoice(id).await
    }

    pub async fn create_purchase_bill(
        &self,
        actor_id: Option<Uuid>,
        req: CreatePurchaseBillRequest,
    ) -> DomainResult<PurchaseBill> {
        let total: rust_decimal::Decimal = req.items.iter().map(|i| i.amount).sum();
        let mut bill = PurchaseBill {
            id: Uuid::new_v4(),
            bill_number: req.bill_number,
            vendor_id: req.vendor_id,
            date: req.date,
            due_date: req.due_date,
            total_amount: total,
            amount_paid: rust_decimal::Decimal::ZERO,
            status: "submitted".to_string(),
            budget_type: req.budget_type.unwrap_or_else(|| "OPEX".to_string()),
            journal_entry_id: None,
            created_at: Utc::now(),
            attachment_url: req.attachment_url,
            company_id: req.company_id,
        };

        let mut uow = UnitOfWork::begin(self.repo.pool()).await?;
        let created_bill = self
            .repo
            .create_purchase_bill_with_uow(&mut uow, &bill)
            .await?;

        // Find Accounts for GL Journal Entry (Hutang Usaha & Beban Ops) via Account Mapping (QSEC-ACMAP-001)
        let ap_acc = if let Some(cid) = req.company_id {
            self.resolve_account(cid, mapping_keys::ACCOUNTS_PAYABLE)
                .await?
                .or(self.find_by_code("2-1100", Some(cid)).await?)
                .or(self.find_by_code("21100", Some(cid)).await?)
                .or(self.find_by_code("2-1100", None).await?)
                .or(self.find_by_code("21100", None).await?)
        } else {
            self.find_by_code("2-1100", None)
                .await?
                .or(self.find_by_code("21100", None).await?)
        };

        let exp_acc = if let Some(cid) = req.company_id {
            self.resolve_account(cid, mapping_keys::OPERATING_EXPENSE)
                .await?
                .or(self.find_by_code("6-1000", Some(cid)).await?)
                .or(self.find_by_code("51000", Some(cid)).await?)
                .or(self.find_by_code("6-1000", None).await?)
                .or(self.find_by_code("51000", None).await?)
        } else {
            self.find_by_code("6-1000", None)
                .await?
                .or(self.find_by_code("51000", None).await?)
        };

        if let (Some(ap), Some(exp)) = (ap_acc, exp_acc) {
            let journal_req = CreateJournalEntryRequest {
                company_id: req.company_id,
                date: created_bill.date,
                description: format!("Tagihan Pembelian: {}", created_bill.bill_number),
                reference: Some(created_bill.bill_number.clone()),
                lines: vec![
                    CreateJournalLineRequest {
                        account_id: exp.id,
                        description: Some(format!("Beban Pembelian {}", created_bill.bill_number)),
                        debit: total,
                        credit: rust_decimal::Decimal::ZERO,
                    },
                    CreateJournalLineRequest {
                        account_id: ap.id,
                        description: Some(format!("Utang Usaha {}", created_bill.bill_number)),
                        debit: rust_decimal::Decimal::ZERO,
                        credit: total,
                    },
                ],
            };

            let journal = JournalRepository::create_journal_entry_with_uow(
                &mut uow,
                format!("BILL-{}", created_bill.bill_number),
                &journal_req,
                actor_id,
            )
            .await?;

            sqlx::query("UPDATE purchase_bills SET journal_entry_id = $1 WHERE id = $2")
                .bind(journal.header.id)
                .bind(created_bill.id)
                .execute(uow.conn())
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?;

            bill.journal_entry_id = Some(journal.header.id);
        }

        uow.commit().await?;
        Ok(created_bill)
    }

    pub async fn list_purchase_bills(&self) -> DomainResult<Vec<PurchaseBill>> {
        self.repo.list_purchase_bills().await
    }

    pub async fn get_purchase_bill(&self, id: Uuid) -> DomainResult<Option<PurchaseBill>> {
        self.repo.get_purchase_bill_by_id(id).await
    }

    pub async fn create_expense(
        &self,
        actor_id: Option<Uuid>,
        req: CreateExpenseRequest,
    ) -> DomainResult<Expense> {
        let expense_number = req
            .expense_number
            .unwrap_or_else(|| format!("EXP-{}", Uuid::new_v4().to_string()[..8].to_uppercase()));
        let mut expense = Expense {
            id: Uuid::new_v4(),
            expense_number,
            date: req.date,
            pay_from_account_id: req.pay_from_account_id,
            recipient: req.recipient,
            total_amount: req.amount,
            status: "paid".to_string(),
            expense_type: req.expense_type,
            journal_entry_id: None,
            created_at: Utc::now(),
            attachment_url: req.attachment_url,
            company_id: req.company_id,
        };

        let mut uow = UnitOfWork::begin(self.repo.pool()).await?;
        let created_expense = self
            .repo
            .create_expense_with_uow(&mut uow, &expense)
            .await?;

        // Find Expense Account via Account Mapping (Default OPERATING_EXPENSE / 6-1000 / 51000)
        let exp_acc = if let Some(cid) = req.company_id {
            self.resolve_account(cid, mapping_keys::OPERATING_EXPENSE)
                .await?
                .or(self.find_by_code("6-1000", Some(cid)).await?)
                .or(self.find_by_code("51000", Some(cid)).await?)
                .or(self.find_by_code("6-1000", None).await?)
                .or(self.find_by_code("51000", None).await?)
        } else {
            self.find_by_code("6-1000", None)
                .await?
                .or(self.find_by_code("51000", None).await?)
        };

        if let Some(exp) = exp_acc {
            let journal_req = CreateJournalEntryRequest {
                company_id: req.company_id,
                date: created_expense.date,
                description: format!("Pengeluaran Beban: {}", created_expense.expense_number),
                reference: Some(created_expense.expense_number.clone()),
                lines: vec![
                    CreateJournalLineRequest {
                        account_id: exp.id,
                        description: Some(format!("Beban {}", created_expense.expense_number)),
                        debit: req.amount,
                        credit: rust_decimal::Decimal::ZERO,
                    },
                    CreateJournalLineRequest {
                        account_id: req.pay_from_account_id,
                        description: Some(format!(
                            "Pembayaran Beban {}",
                            created_expense.expense_number
                        )),
                        debit: rust_decimal::Decimal::ZERO,
                        credit: req.amount,
                    },
                ],
            };

            let journal = JournalRepository::create_journal_entry_with_uow(
                &mut uow,
                format!("EXP-{}", created_expense.expense_number),
                &journal_req,
                actor_id,
            )
            .await?;

            sqlx::query("UPDATE expenses SET journal_entry_id = $1 WHERE id = $2")
                .bind(journal.header.id)
                .bind(created_expense.id)
                .execute(uow.conn())
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?;

            expense.journal_entry_id = Some(journal.header.id);
        }

        uow.commit().await?;
        Ok(created_expense)
    }

    pub async fn list_expenses(&self) -> DomainResult<Vec<Expense>> {
        self.repo.list_expenses().await
    }

    pub async fn create_cash_bank_transaction(
        &self,
        actor_id: Option<Uuid>,
        req: CreateCashBankTransactionRequest,
    ) -> DomainResult<CashBankTransaction> {
        let tx_number = req
            .transaction_number
            .clone()
            .unwrap_or_else(|| format!("TX-{}", Uuid::new_v4().to_string()[..8].to_uppercase()));
        let tx = CashBankTransaction {
            id: Uuid::new_v4(),
            transaction_number: tx_number,
            transaction_type: req.transaction_type,
            date: req.date,
            amount: req.amount,
            from_account_id: req.from_account_id,
            to_account_id: req.to_account_id,
            account_id: req.account_id,
            contact_name: req.contact_name,
            description: req.description,
            journal_entry_id: None,
            created_at: Utc::now(),
            company_id: None,
        };

        let mut uow = UnitOfWork::begin(self.repo.pool()).await?;
        let created_tx = self.repo.create_cash_bank_transaction(&tx).await?;

        // If transfer/inflow/outflow accounts provided, create Journal Entry
        if let (Some(from_acc), Some(to_acc)) = (req.from_account_id, req.to_account_id) {
            let journal_req = CreateJournalEntryRequest {
                company_id: None,
                date: created_tx.date,
                description: format!("Transaksi Kas/Bank: {}", created_tx.transaction_number),
                reference: Some(created_tx.transaction_number.clone()),
                lines: vec![
                    CreateJournalLineRequest {
                        account_id: to_acc,
                        description: Some(format!(
                            "Penerimaan/Transfer {}",
                            created_tx.transaction_number
                        )),
                        debit: req.amount,
                        credit: rust_decimal::Decimal::ZERO,
                    },
                    CreateJournalLineRequest {
                        account_id: from_acc,
                        description: Some(format!(
                            "Pengeluaran/Transfer {}",
                            created_tx.transaction_number
                        )),
                        debit: rust_decimal::Decimal::ZERO,
                        credit: req.amount,
                    },
                ],
            };

            let journal = JournalRepository::create_journal_entry_with_uow(
                &mut uow,
                format!("CASH-{}", created_tx.transaction_number),
                &journal_req,
                actor_id,
            )
            .await?;

            sqlx::query("UPDATE cash_bank_transactions SET journal_entry_id = $1 WHERE id = $2")
                .bind(journal.header.id)
                .bind(created_tx.id)
                .execute(uow.conn())
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?;
        }

        uow.commit().await?;
        Ok(created_tx)
    }

    pub async fn list_sales_quotes(&self) -> DomainResult<Vec<SalesQuote>> {
        self.repo.list_sales_quotes().await
    }

    pub async fn create_sales_quote(
        &self,
        req: CreateSalesQuoteRequest,
    ) -> DomainResult<SalesQuote> {
        let total: rust_decimal::Decimal =
            req.items.iter().map(|i| i.quantity * i.unit_price).sum();
        let quote = SalesQuote {
            id: Uuid::new_v4(),
            quote_number: req.quote_number,
            client_id: req.client_id,
            date: req.date,
            expiry_date: req.expiry_date,
            subject: req.subject,
            subtotal: total,
            tax: rust_decimal::Decimal::ZERO,
            total_amount: total,
            status: "draft".to_string(),
            created_at: Utc::now(),
            company_id: None,
        };
        self.repo.create_sales_quote(&quote).await
    }

    pub async fn list_sales_orders(&self) -> DomainResult<Vec<SalesOrder>> {
        self.repo.list_sales_orders().await
    }

    pub async fn create_sales_order(
        &self,
        req: CreateSalesOrderRequest,
    ) -> DomainResult<SalesOrder> {
        let total: rust_decimal::Decimal =
            req.items.iter().map(|i| i.quantity * i.unit_price).sum();
        let order = SalesOrder {
            id: Uuid::new_v4(),
            order_number: req.order_number,
            quote_id: req.quote_id,
            client_id: req.client_id,
            date: req.date,
            delivery_date: req.delivery_date,
            subject: req.subject,
            subtotal: total,
            tax: rust_decimal::Decimal::ZERO,
            total_amount: total,
            status: "draft".to_string(),
            created_at: Utc::now(),
            company_id: None,
        };
        self.repo.create_sales_order(&order).await
    }

    pub async fn list_sales_shipments(&self) -> DomainResult<Vec<SalesShipment>> {
        self.repo.list_sales_shipments().await
    }

    pub async fn create_sales_shipment(
        &self,
        req: CreateSalesShipmentRequest,
    ) -> DomainResult<SalesShipment> {
        let shipment_id = Uuid::new_v4();
        let shipment = SalesShipment {
            id: shipment_id,
            shipment_number: req.shipment_number,
            sales_order_id: req.sales_order_id,
            client_id: None,
            warehouse_id: req.warehouse_id,
            date: req.date,
            courier_name: req.courier_name,
            tracking_number: req.tracking_number,
            status: "pending".to_string(),
            created_at: Utc::now(),
            company_id: None,
        };

        let items: Vec<SalesShipmentItem> = req
            .items
            .into_iter()
            .map(|item| SalesShipmentItem {
                id: Uuid::new_v4(),
                shipment_id,
                order_item_id: item.order_item_id,
                description: item.description,
                quantity_shipped: item.quantity_shipped,
                item_id: item.item_id,
            })
            .collect();

        self.repo.create_sales_shipment(&shipment, &items).await
    }

    pub async fn list_purchase_quotes(&self) -> DomainResult<Vec<PurchaseQuote>> {
        self.repo.list_purchase_quotes().await
    }

    pub async fn create_purchase_quote(
        &self,
        req: CreatePurchaseQuoteRequest,
    ) -> DomainResult<PurchaseQuote> {
        let total: rust_decimal::Decimal = req.items.iter().map(|i| i.amount).sum();
        let quote = PurchaseQuote {
            id: Uuid::new_v4(),
            quote_number: req.quote_number,
            vendor_id: req.vendor_id,
            date: req.date,
            expiry_date: req.expiry_date,
            subject: req.subject,
            subtotal: total,
            tax: rust_decimal::Decimal::ZERO,
            total_amount: total,
            status: "draft".to_string(),
            created_at: Utc::now(),
            company_id: None,
        };
        self.repo.create_purchase_quote(&quote).await
    }

    pub async fn list_purchase_orders(&self) -> DomainResult<Vec<PurchaseOrder>> {
        self.repo.list_purchase_orders().await
    }

    pub async fn create_purchase_order(
        &self,
        req: CreatePurchaseOrderRequest,
    ) -> DomainResult<PurchaseOrder> {
        let total: rust_decimal::Decimal = req.items.iter().map(|i| i.amount).sum();
        let order = PurchaseOrder {
            id: Uuid::new_v4(),
            order_number: req.order_number,
            purchase_quote_id: req.purchase_quote_id,
            vendor_id: req.vendor_id,
            date: req.date,
            delivery_date: req.delivery_date,
            subject: req.subject,
            subtotal: total,
            tax: rust_decimal::Decimal::ZERO,
            total_amount: total,
            status: "draft".to_string(),
            budget_type: req.budget_type.unwrap_or_else(|| "OPEX".to_string()),
            created_at: Utc::now(),
            company_id: None,
        };
        let po = self.repo.create_purchase_order(&order).await?;
        Ok(po)
    }

    pub async fn list_purchase_shipments(&self) -> DomainResult<Vec<PurchaseShipment>> {
        self.repo.list_purchase_shipments().await
    }

    pub async fn create_purchase_shipment(
        &self,
        req: CreatePurchaseShipmentRequest,
    ) -> DomainResult<PurchaseShipment> {
        let shipment = PurchaseShipment {
            id: Uuid::new_v4(),
            shipment_number: req.shipment_number,
            purchase_order_id: req.purchase_order_id,
            vendor_id: None,
            date: req.date,
            courier_name: req.courier_name,
            tracking_number: req.tracking_number,
            status: "received".to_string(),
            created_at: Utc::now(),
            company_id: None,
        };
        self.repo.create_purchase_shipment(&shipment).await
    }

    pub async fn list_purchase_receipts(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<PurchaseReceipt>> {
        self.repo.list_purchase_receipts(company_id).await
    }

    pub async fn get_purchase_receipt(&self, id: Uuid) -> DomainResult<Option<PurchaseReceipt>> {
        self.repo.get_purchase_receipt(id).await
    }

    pub async fn create_purchase_receipt(
        &self,
        req: CreatePurchaseReceiptRequest,
        created_by: Option<Uuid>,
    ) -> DomainResult<PurchaseReceipt> {
        let receipt_id = Uuid::new_v4();
        let receipt = PurchaseReceipt {
            id: receipt_id,
            company_id: req.company_id,
            receipt_number: req.receipt_number,
            purchase_order_id: req.purchase_order_id,
            vendor_id: req.vendor_id,
            warehouse_id: req.warehouse_id,
            posting_date: req.posting_date,
            status: "draft".to_string(),
            notes: req.notes,
            created_at: chrono::Utc::now(),
            created_by,
        };

        let items: Vec<PurchaseReceiptItem> = req
            .items
            .into_iter()
            .map(|item| {
                let total_amount = item.qty_received * item.unit_cost;
                PurchaseReceiptItem {
                    id: Uuid::new_v4(),
                    receipt_id,
                    item_id: item.item_id,
                    qty_received: item.qty_received,
                    unit_cost: item.unit_cost,
                    total_amount,
                    po_line_id: item.po_line_id,
                    batch_no: item.batch_no,
                    serial_no: item.serial_no,
                }
            })
            .collect();

        self.repo.create_purchase_receipt(&receipt, &items).await
    }

    // --- Budget Management (QACC-010) ---

    pub async fn list_budgets(&self, company_id: Uuid) -> DomainResult<Vec<Budget>> {
        self.repo.list_budgets(company_id).await
    }

    pub async fn create_budget(
        &self,
        company_id: Uuid,
        req: CreateBudgetRequest,
    ) -> DomainResult<Budget> {
        let budget = Budget {
            id: Uuid::new_v4(),
            company_id: Some(company_id),
            cost_center_id: req.cost_center_id,
            fiscal_year: req.fiscal_year,
            monthly_distribution: req.monthly_distribution,
            action_if_accumulated_monthly_budget_exceeded: None,
            action_if_annual_budget_exceeded: req
                .action_if_annual_budget_exceeded
                .or_else(|| Some("Warn".to_string())),
            created_at: Utc::now(),
        };

        self.repo
            .create_budget_with_items(&budget, &req.accounts)
            .await
    }

    pub async fn get_budget_variance(
        &self,
        company_id: Uuid,
        fiscal_year: Option<&str>,
    ) -> DomainResult<Vec<BudgetVarianceReport>> {
        self.repo
            .get_budget_variance_report(company_id, fiscal_year)
            .await
    }

    pub async fn list_tax_invoices(
        &self,
        company_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<TaxInvoiceRecord>> {
        self.repo
            .list_tax_invoices(company_id, start_date, end_date)
            .await
    }

    pub async fn create_tax_invoice(
        &self,
        record: &TaxInvoiceRecord,
    ) -> DomainResult<TaxInvoiceRecord> {
        self.repo.create_tax_invoice(record).await
    }

    pub async fn export_djp_csv(
        &self,
        company_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<String> {
        let records = self
            .repo
            .list_tax_invoices(company_id, start_date, end_date)
            .await?;
        let headers: Vec<TaxInvoiceHeader> = records
            .into_iter()
            .map(|rec| {
                let dpp = rec.tax_base;
                let ppn = rec.vat_amount;
                TaxInvoiceHeader {
                    id: rec.id,
                    company_id: rec.company_id,
                    sales_invoice_id: rec.sales_invoice_id,
                    tax_invoice_number: rec.tax_invoice_number.clone(),
                    transaction_type_code: "01".to_string(),
                    is_replacement: false,
                    tax_period_month: rec.effective_date.month(),
                    tax_period_year: rec.effective_date.year(),
                    invoice_date: rec.effective_date,
                    buyer_npwp: rec.npwp_buyer,
                    buyer_name: rec.name_buyer,
                    buyer_address: "Indonesia".to_string(),
                    total_dpp: dpp,
                    total_ppn: ppn,
                    reference_number: rec.tax_invoice_number,
                    items: vec![TaxInvoiceItem {
                        item_code: "INV-ITEM".to_string(),
                        item_name: "Penyerahan Barang/Jasa Kena Pajak".to_string(),
                        unit_price: dpp,
                        quantity: rust_decimal_macros::dec!(1.0),
                        total_price: dpp,
                        discount: rust_decimal_macros::dec!(0.0),
                        dpp,
                        ppn,
                        ppnbm_rate: rust_decimal_macros::dec!(0.0),
                        ppnbm_amount: rust_decimal_macros::dec!(0.0),
                    }],
                }
            })
            .collect();

        let batch = EFakturCsvBatch::new(headers);
        Ok(batch.generate_djp_csv())
    }

    pub async fn update_sales_invoice_status(
        &self,
        id: Uuid,
        status: &str,
    ) -> DomainResult<()> {
        self.repo.update_sales_invoice_status(id, status).await
    }

    pub async fn update_purchase_bill_status(
        &self,
        id: Uuid,
        status: &str,
    ) -> DomainResult<()> {
        self.repo.update_purchase_bill_status(id, status).await
    }

    pub async fn import_bank_statement(
        &self,
        company_id: Uuid,
        uploaded_by: Uuid,
        req: crate::domain::entities::ImportBankStatementRequest,
    ) -> DomainResult<crate::domain::entities::BankStatement> {
        let stmt_id = Uuid::new_v4();
        let open_bal = req.opening_balance.unwrap_or(rust_decimal::Decimal::ZERO);
        let mut running_bal = open_bal;
        for line in &req.lines {
            running_bal += line.amount;
        }
        let close_bal = req.closing_balance.unwrap_or(running_bal);

        let stmt = crate::domain::entities::BankStatement {
            id: stmt_id,
            company_id,
            account_id: req.account_id,
            statement_date: req.statement_date,
            reference_number: req.reference_number,
            opening_balance: open_bal,
            closing_balance: close_bal,
            status: "DRAFT".to_string(),
            uploaded_by,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let lines: Vec<crate::domain::entities::BankStatementLine> = req
            .lines
            .into_iter()
            .map(|l| crate::domain::entities::BankStatementLine {
                id: Uuid::new_v4(),
                statement_id: stmt_id,
                company_id,
                transaction_date: l.transaction_date,
                description: l.description,
                reference_number: l.reference_number,
                amount: l.amount,
                is_reconciled: false,
                matched_gl_entry_id: None,
                created_at: chrono::Utc::now(),
            })
            .collect();

        self.repo.create_bank_statement(&stmt, &lines).await
    }

    pub async fn list_bank_statements(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<crate::domain::entities::BankStatement>> {
        self.repo.list_bank_statements(company_id).await
    }

    pub async fn get_bank_statement(
        &self,
        id: Uuid,
    ) -> DomainResult<Option<crate::domain::entities::BankStatementDetailResponse>> {
        let opt = self.repo.get_bank_statement(id).await?;
        Ok(opt.map(|(statement, lines)| crate::domain::entities::BankStatementDetailResponse {
            statement,
            lines,
        }))
    }

    pub async fn auto_match_bank_statement(
        &self,
        id: Uuid,
    ) -> DomainResult<crate::domain::entities::AutoMatchResult> {
        self.repo.auto_match_bank_statement_lines(id).await
    }

    pub async fn reconcile_bank_statement(
        &self,
        id: Uuid,
        reconciled_by: Uuid,
        as_of_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<crate::domain::entities::BankReconciliation> {
        let stmt = self.repo.get_bank_statement(id).await?
            .ok_or_else(|| DomainError::not_found("BankStatement", id))?.0;
        let date = as_of_date.unwrap_or(stmt.statement_date);
        self.repo.finalize_bank_reconciliation(id, reconciled_by, date).await
    }

    pub async fn list_bank_reconciliations(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<crate::domain::entities::BankReconciliation>> {
        self.repo.list_bank_reconciliations(company_id).await
    }

}
