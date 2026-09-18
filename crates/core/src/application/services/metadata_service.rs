use crate::domain::metadata_kernel::{
    EntityType, FieldDefinition, LayoutDefinition, StorageStrategy,
};
use crate::infrastructure::repositories::MetadataRepository;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

/// DTO for an entire Entity Type with its Fields and Layout
#[derive(Debug, Serialize, Deserialize)]
pub struct EntityMetadataBundle {
    pub entity: EntityType,
    pub fields: Vec<FieldDefinition>,
    pub layout: Option<LayoutDefinition>,
}

#[derive(Clone)]
pub struct MetadataService {
    repository: Arc<MetadataRepository>,
}

impl MetadataService {
    pub fn new(repository: MetadataRepository) -> Self {
        Self {
            repository: Arc::new(repository),
        }
    }

    pub async fn register_entity_type(
        &self,
        name: &str,
        module: &str,
        storage_strategy: StorageStrategy,
        is_custom: bool,
    ) -> Result<EntityType, String> {
        // Validate name format (uppercase, snake_case is convention, but no spaces)
        if name.contains(' ') || name.is_empty() {
            return Err("Invalid entity type name. Spaces are not allowed.".to_string());
        }

        // Check if exists
        if let Ok(Some(_)) = self.repository.find_entity_type_by_name(name).await {
            return Err(format!("EntityType '{}' already exists", name));
        }

        let entity_type = EntityType {
            id: Uuid::new_v4(),
            name: name.to_string().to_uppercase(),
            module: module.to_string(),
            storage_strategy,
            is_custom,
            version: 1,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        self.repository
            .create_entity_type(&entity_type)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn add_custom_field(
        &self,
        entity_type_name: &str,
        field_name: &str,
        label: &str,
        data_type: &str,
        is_required: bool,
    ) -> Result<FieldDefinition, String> {
        let entity = self
            .repository
            .find_entity_type_by_name(entity_type_name)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("EntityType '{}' not found", entity_type_name))?;

        // Basic validation
        if field_name.contains(' ') || field_name.to_lowercase() != field_name {
            return Err("field_name must be lowercase without spaces".to_string());
        }

        let valid_types = vec![
            "STRING", "NUMBER", "DECIMAL", "BOOLEAN", "DATE", "DATETIME", "JSON",
        ];
        if !valid_types.contains(&data_type.to_uppercase().as_str()) {
            return Err(format!(
                "Invalid data_type. Must be one of {:?}",
                valid_types
            ));
        }

        let field = FieldDefinition {
            id: Uuid::new_v4(),
            entity_type_id: entity.id,
            field_name: field_name.to_string(),
            label: label.to_string(),
            data_type: data_type.to_uppercase(),
            is_required,
            is_readonly: false,
            default_value: None,
            options_json: Some(serde_json::json!({})),
        };

        self.repository
            .create_field_definition(&field)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_entity_bundle(
        &self,
        entity_name: &str,
    ) -> Result<EntityMetadataBundle, String> {
        let entity = self
            .repository
            .find_entity_type_by_name(entity_name)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("EntityType '{}' not found", entity_name))?;

        let fields = self
            .repository
            .find_fields_by_entity_type(entity.id)
            .await
            .map_err(|e| e.to_string())?;

        let layout = self
            .repository
            .get_layout(entity.id, "DEFAULT")
            .await
            .map_err(|e| e.to_string())?;

        Ok(EntityMetadataBundle {
            entity,
            fields,
            layout,
        })
    }

    pub async fn remove_field(&self, field_id: Uuid) -> Result<u64, String> {
        self.repository
            .delete_field_definition(field_id)
            .await
            .map_err(|e| e.to_string())
    }

    /// Validate a dynamic entity payload against its registered `FieldDefinition`s.
    ///
    /// Rejects:
    ///   * unknown fields (typos would otherwise be silently persisted),
    ///   * missing required fields,
    ///   * values whose JSON type does not match the declared `data_type`.
    pub async fn validate_entity_data(
        &self,
        entity_name: &str,
        data: &serde_json::Value,
    ) -> Result<(), String> {
        let object = data
            .as_object()
            .ok_or_else(|| "Entity payload must be a JSON object".to_string())?;

        let bundle = self.get_entity_bundle(entity_name).await?;

        // 1. Reject fields that are not part of the entity definition.
        let known: std::collections::HashSet<&str> = bundle
            .fields
            .iter()
            .map(|f| f.field_name.as_str())
            .collect();

        let unknown: Vec<&str> = object
            .keys()
            .map(|k| k.as_str())
            .filter(|k| !known.contains(*k))
            .collect();
        if !unknown.is_empty() {
            return Err(format!(
                "Unknown field(s) for entity '{}': {}",
                entity_name,
                unknown.join(", ")
            ));
        }

        // 2. Validate required fields and per-field types.
        let mut errors: Vec<String> = Vec::new();
        for field in &bundle.fields {
            match object.get(&field.field_name) {
                Some(value) => {
                    if let Err(e) = field.validate_value(value) {
                        errors.push(e);
                    }
                }
                None => {
                    if field.is_required {
                        // A declared default satisfies the requirement.
                        if field.default_value.is_none() {
                            errors.push(format!("Field '{}' is required", field.label));
                        }
                    }
                }
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors.join("; "))
        }
    }
}
