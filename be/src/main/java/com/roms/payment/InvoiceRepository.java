package com.roms.payment;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByOrder_Id(UUID orderId);
    List<Invoice> findAllByCreatedAtBetween(Instant from, Instant to);
}
