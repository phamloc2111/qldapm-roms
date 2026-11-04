package com.roms.auth;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class StompSecurity {
    private final TokenService tokens;
    private final Map<String, String> sessions = new ConcurrentHashMap<>();

    public StompSecurity(TokenService tokens) { this.tokens = tokens; }

    public ChannelInterceptor inbound() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor headers = StompHeaderAccessor.wrap(message);
                StompCommand command = headers.getCommand();
                String session = headers.getSessionId();
                if (command == StompCommand.DISCONNECT) {
                    if (session != null) sessions.remove(session);
                    return message;
                }
                if (command == StompCommand.CONNECT || command == StompCommand.STOMP) {
                    List<String> authorization = headers.getNativeHeader("Authorization");
                    if (session == null || authorization == null || authorization.size() != 1
                            || !authorization.getFirst().startsWith("Bearer ")) throw denied();
                    String token = authorization.getFirst().substring(7);
                    Authentication auth = tokens.authenticate(token);
                    sessions.put(session, token);
                    // Set the principal on the original mutable headers, not only the wrapper.
                    SimpMessageHeaderAccessor original = org.springframework.messaging.support.MessageHeaderAccessor.getAccessor(message, SimpMessageHeaderAccessor.class);
                    if (original == null) { sessions.remove(session); throw denied(); }
                    original.setUser(auth);
                    return message;
                }
                // Heartbeats carry no command but still require a valid session.
                String token = session == null ? null : sessions.get(session);
                if (token == null) throw denied();
                Authentication auth = tokens.authenticate(token);
                if (command == StompCommand.SUBSCRIBE) {
                    if (!allowed(headers.getDestination(), auth)) throw denied();
                } else if (command != null && command != StompCommand.UNSUBSCRIBE) {
                    // No client SEND, including to broker or application destinations.
                    throw denied();
                }
                return message;
            }
        };
    }

    public ChannelInterceptor outbound() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(message);
                if (headers.getMessageType() != SimpMessageType.MESSAGE) return message;
                String session = headers.getSessionId();
                String token = session == null ? null : sessions.get(session);
                if (token == null) return null;
                try {
                    Authentication auth = tokens.authenticate(token);
                    return allowed(headers.getDestination(), auth) ? message : null;
                } catch (RuntimeException ex) {
                    sessions.remove(session);
                    return null;
                }
            }
        };
    }

    @EventListener
    public void disconnected(SessionDisconnectEvent event) { sessions.remove(event.getSessionId()); }

    private boolean allowed(String destination, Authentication auth) {
        if (destination == null) return false;
        if (has(auth, "ADMIN")) return destination.equals("/topic/kitchen") || destination.equals("/topic/cashier")
                || destination.equals("/topic/tables") || destination.equals("/topic/menu") || orderTopic(destination);
        if (has(auth, "WAITER")) return destination.equals("/topic/tables") || destination.equals("/topic/menu") || orderTopic(destination);
        if (has(auth, "KITCHEN")) return destination.equals("/topic/kitchen") || destination.equals("/topic/menu");
        return has(auth, "CASHIER") && destination.equals("/topic/cashier");
    }

    private boolean orderTopic(String destination) {
        return destination.matches("/topic/orders/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    }
    private boolean has(Authentication auth, String role) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
    private AccessDeniedException denied() { return new AccessDeniedException("STOMP access denied"); }
}