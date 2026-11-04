package com.roms.payment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false, unique = true)
    private Invoice invoice;

    @Column(name = "amount_vnd", nullable = false)
    private long amountVnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethod method;

    @Column(name = "paid_at", nullable = false, updatable = false)
    private Instant paidAt = Instant.now();

    protected Payment() {
    }

    public Payment(Invoice invoice, long amountVnd, PaymentMethod method) {
        this.invoice = invoice;
        this.amountVnd = amountVnd;
        this.method = method;
    }

    public UUID getId() { return id; }
    public Invoice getInvoice() { return invoice; }
    public long getAmountVnd() { return amountVnd; }
    public PaymentMethod getMethod() { return method; }
    public Instant getPaidAt() { return paidAt; }
}