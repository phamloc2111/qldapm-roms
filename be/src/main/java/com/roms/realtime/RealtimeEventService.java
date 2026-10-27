package com.roms.realtime;

import java.time.Instant;
import java.util.UUID;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class RealtimeEventService {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeEventService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void orderSubmitted(UUID orderId, Object payload) {
        send("/topic/kitchen", "order.submitted", orderId, payload);
    }

    public void itemStatusChanged(UUID orderId, Object payload) {
        send("/topic/orders/" + orderId, "order_item.status_changed", orderId, payload);
    }

    public void tableStatusChanged(UUID tableId, Object payload) {
        send("/topic/tables", "table.status_changed", tableId, payload);
    }

    public void menuAvailabilityChanged(UUID menuItemId, Object payload) {
        send("/topic/menu", "menu.availability_changed", menuItemId, payload);
    }

    public void paymentRequested(UUID orderId, Object payload) {
        send("/topic/cashier", "payment.requested", orderId, payload);
    }

    public void paymentCompleted(UUID orderId, Object payload) {
        send("/topic/orders/" + orderId, "payment.completed", orderId, payload);
    }

    private void send(String destination, String type, UUID entityId, Object payload) {
        Runnable publish = () -> messagingTemplate.convertAndSend(destination,
                new RealtimeEvent(UUID.randomUUID(), type, entityId, Instant.now(), payload));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
        } else {
            publish.run();
        }
    }

    public record RealtimeEvent(UUID eventId, String eventType, UUID entityId, Instant occurredAt, Object data) { }
}