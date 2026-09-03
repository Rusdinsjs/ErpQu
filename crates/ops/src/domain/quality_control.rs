//! Quality Control & Inspection Gatekeeping Domain (QQLT-001, QQLT-004)

use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum InspectionStatus {
    Pending,
    Passed,
    Rejected,
    QualityHold,
}

impl InspectionStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pending => "PENDING",
            Self::Passed => "PASSED",
            Self::Rejected => "REJECTED",
            Self::QualityHold => "QUALITY_HOLD",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "PASSED" => Self::Passed,
            "REJECTED" => Self::Rejected,
            "QUALITY_HOLD" => Self::QualityHold,
            _ => Self::Pending,
        }
    }

    pub fn is_allowed_for_stock_release(&self) -> bool {
        matches!(self, Self::Passed)
    }
}

/// Inspection Parameter Criteria
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityParameterCriteria {
    pub parameter_name: String,
    pub min_value: Option<Decimal>,
    pub max_value: Option<Decimal>,
    pub expected_text: Option<String>,
}

impl QualityParameterCriteria {
    pub fn evaluate_numeric(&self, actual_value: Decimal) -> bool {
        if let Some(min) = self.min_value {
            if actual_value < min {
                return false;
            }
        }
        if let Some(max) = self.max_value {
            if actual_value > max {
                return false;
            }
        }
        true
    }

    pub fn evaluate_text(&self, actual_text: &str) -> bool {
        if let Some(expected) = &self.expected_text {
            return actual_text.trim().eq_ignore_ascii_case(expected.trim());
        }
        true
    }
}

/// Evaluation Summary for Inspection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityInspectionEvaluation {
    pub inspection_id: Uuid,
    pub overall_status: InspectionStatus,
    pub passed_parameters: usize,
    pub failed_parameters: usize,
    pub notes: Option<String>,
}
