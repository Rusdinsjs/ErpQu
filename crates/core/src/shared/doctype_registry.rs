pub struct DocTypeRegistration {
    pub name: &'static str,
    pub module: &'static str,
    pub description: &'static str,
    pub is_submittable: bool,
}

inventory::collect!(DocTypeRegistration);
