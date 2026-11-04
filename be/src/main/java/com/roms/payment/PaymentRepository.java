package com.roms.payment;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findAllByPaidAtBetween(Instant from, Instant to);
}
