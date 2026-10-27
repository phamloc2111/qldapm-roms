package com.roms;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.roms.realtime.RealtimeEventService;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class RealtimeEventServiceTest {
    private final SimpMessagingTemplate template = mock(SimpMessagingTemplate.class);
    private final RealtimeEventService service = new RealtimeEventService(template);

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void eventIsSentAfterCommitNotBefore() {
        TransactionSynchronizationManager.initSynchronization();
        service.orderSubmitted(UUID.randomUUID(), "payload");
        verifyNoInteractions(template);
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(template).convertAndSend(eq("/topic/kitchen"), any(RealtimeEventService.RealtimeEvent.class));
    }

    @Test
    void rolledBackTransactionDoesNotPublish() {
        TransactionSynchronizationManager.initSynchronization();
        service.orderSubmitted(UUID.randomUUID(), "payload");
        TransactionSynchronizationManager.getSynchronizations().forEach(
                sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        verifyNoInteractions(template);
    }

    @Test
    void eventWithoutTransactionIsSentImmediately() {
        service.menuAvailabilityChanged(UUID.randomUUID(), "payload");
        verify(template).convertAndSend(eq("/topic/menu"), any(RealtimeEventService.RealtimeEvent.class));
    }
}
