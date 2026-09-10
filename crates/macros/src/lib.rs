extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, LitBool, LitStr};

#[proc_macro_derive(DocType, attributes(doctype))]
pub fn doctype_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let struct_name = &input.ident;

    let mut module = String::new();
    let mut description = String::new();
    let mut is_submittable = false;

    // Parse attributes
    for attr in input.attrs.iter() {
        if attr.path().is_ident("doctype") {
            let _ = attr.parse_nested_meta(|meta| {
                if meta.path.is_ident("module") {
                    let value = meta.value()?;
                    let lit: LitStr = value.parse()?;
                    module = lit.value();
                } else if meta.path.is_ident("description") {
                    let value = meta.value()?;
                    let lit: LitStr = value.parse()?;
                    description = lit.value();
                } else if meta.path.is_ident("is_submittable") {
                    let value = meta.value()?;
                    let lit: LitBool = value.parse()?;
                    is_submittable = lit.value();
                }
                Ok(())
            });
        }
    }

    let struct_name_str = struct_name.to_string();

    let pkg_name = std::env::var("CARGO_PKG_NAME").unwrap_or_default();
    let core_path = if pkg_name == "management-system-core" {
        quote! { crate }
    } else {
        quote! { management_system_core }
    };

    let expanded = quote! {
        #core_path::inventory::submit! {
            #core_path::shared::doctype_registry::DocTypeRegistration {
                name: #struct_name_str,
                module: #module,
                description: #description,
                is_submittable: #is_submittable,
            }
        }
    };

    TokenStream::from(expanded)
}
