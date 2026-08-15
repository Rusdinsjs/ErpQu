use axum::{
    extract::{
        ws::{Message, WebSocket},
        Request, State, WebSocketUpgrade,
    },
    http::{header, StatusCode},
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use tracing::info;
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::infrastructure::notifications::WsSessionInfo;
use management_system_core::shared::utils::jwt::decode_token;

/// Handler for WebSocket upgrade request (QSEC-005 Authenticated Handshake without token leakage in URL)
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    req: Request,
) -> Result<impl IntoResponse, StatusCode> {
    // 1. Extract token securely from Authorization header, Sec-WebSocket-Protocol, or Cookie (NEVER raw query URL)
    let token = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer ").map(String::from))
        .or_else(|| {
            req.headers()
                .get(header::SEC_WEBSOCKET_PROTOCOL)
                .and_then(|h| h.to_str().ok())
                .map(String::from)
        })
        .or_else(|| {
            req.headers()
                .get(header::COOKIE)
                .and_then(|h| h.to_str().ok())
                .and_then(|cookies| {
                    cookies
                        .split(';')
                        .find_map(|c| {
                            let trimmed = c.trim();
                            if trimmed.starts_with("token=") {
                                Some(trimmed.trim_start_matches("token=").to_string())
                            } else if trimmed.starts_with("auth_token=") {
                                Some(trimmed.trim_start_matches("auth_token=").to_string())
                            } else {
                                None
                            }
                        })
                })
        });

    let token_str = match token {
        Some(t) => t,
        None => {
            tracing::warn!(
                "WebSocket Handshake REJECTED: Anonymous connection attempt without secure token header/cookie"
            );
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    // 2. Decode and validate JWT token claims
    let claims = match decode_token(&token_str, &state.jwt_config) {
        Ok(c) => c,
        Err(e) => {
            tracing::warn!(
                "WebSocket Handshake REJECTED: Invalid/expired token: {:?}",
                e
            );
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    // 3. Upgrade connection and bind to user context
    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, claims)))
}

/// Actual WebSocket connection handler bound to authenticated UserClaims
async fn handle_socket(
    socket: WebSocket,
    state: AppState,
    claims: management_system_core::domain::entities::UserClaims,
) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    let session_id = Uuid::new_v4();
    let user_id = claims.user_id();
    let username = claims.sub.clone();

    info!(
        "WebSocket Connected: user_id={}, username={}, session_id={}",
        user_id, username, session_id
    );

    // Register active session in notification broker
    let session_info = WsSessionInfo {
        session_id,
        user_id,
        role: claims.role.clone(),
        organization_id: claims.org.as_deref().and_then(|o| Uuid::parse_str(o).ok()),
        company_id: None,
        tx,
    };
    state.ws_manager.register(session_info).await;

    // Send connection established confirmation message
    let welcome = serde_json::json!({
        "event": "connected",
        "data": {
            "session_id": session_id,
            "user_id": user_id,
            "username": username
        }
    });
    let _ = sender.send(Message::Text(welcome.to_string())).await;

    // Spawn task to forward outgoing broker messages to client socket
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    // Spawn task to read incoming messages from client (handle Ping/Pong/Disconnect)
    let ws_manager = state.ws_manager.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => break,
                Message::Ping(_) => {}
                Message::Text(txt) => {
                    tracing::debug!("WebSocket received message from {}: {}", user_id, txt);
                }
                _ => {}
            }
        }
        ws_manager.unregister(&session_id).await;
        info!("WebSocket Disconnected: session_id={}", session_id);
    });

    // Terminate when either sender or receiver finishes
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
