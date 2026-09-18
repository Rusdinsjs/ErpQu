//! Canonical HR DocType metadata, workflow, and tenant policy integration tests.

use sqlx::{PgPool, Row};

#[sqlx::test(migrations = "../../database/migrations")]
async fn canonical_hr_doctypes_have_runtime_metadata(pool: PgPool) {
    let expected = [
        ("Attendance", false),
        ("LeaveApplication", true),
        ("ExpenseClaim", true),
        ("EmployeeLoan", true),
    ];

    for (name, is_submittable) in expected {
        let row = sqlx::query("SELECT is_submittable FROM doctypes WHERE name = $1")
            .bind(name)
            .fetch_one(&pool)
            .await
            .expect("canonical DocType should exist");
        assert_eq!(row.get::<bool, _>("is_submittable"), is_submittable);
    }

    let stale_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM doctypes WHERE name IN ('HrLeaveApplication', 'HrExpenseClaim', 'HrEmployeeLoan')",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stale_count, 0);
}

#[sqlx::test(migrations = "../../database/migrations")]
async fn employee_loan_workflow_is_canonical_and_connected(pool: PgPool) {
    let row = sqlx::query(
        r#"
        SELECT d.name, COUNT(DISTINCT ws.id) AS states, COUNT(DISTINCT wt.id) AS transitions
        FROM workflows w
        JOIN doctypes d ON d.id = w.doctype_id
        LEFT JOIN workflow_states ws ON ws.workflow_id = w.id
        LEFT JOIN workflow_transitions wt ON wt.workflow_id = w.id
        WHERE d.name = 'EmployeeLoan' AND w.is_active = TRUE
        GROUP BY d.name
        "#,
    )
    .fetch_one(&pool)
    .await
    .expect("EmployeeLoan workflow should exist");

    assert_eq!(row.get::<String, _>("name"), "EmployeeLoan");
    assert!(row.get::<i64, _>("states") >= 5);
    assert!(row.get::<i64, _>("transitions") >= 4);
}

#[sqlx::test(migrations = "../../database/migrations")]
async fn hr_transaction_tables_have_company_policy(pool: PgPool) {
    let count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM pg_policies
        WHERE (schemaname, tablename) IN (
            ('hr', 'attendance_records'),
            ('public', 'hr_leave_applications'),
            ('public', 'hr_expense_claims'),
            ('public', 'hr_employee_loans')
        )
        "#,
    )
    .fetch_one(&pool)
    .await
    .unwrap();

    assert_eq!(count, 4);
}
