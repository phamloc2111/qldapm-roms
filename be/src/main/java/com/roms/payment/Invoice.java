package com.roms.payment;

import com.roms.order.RestaurantOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private RestaurantOrder order;

    @Column(name = "subtotal_vnd", nullable = false)
    private long subtotalVnd;

    @Column(name = "discount_vnd", nullable = false)
    private long discountVnd;

    @Column(name = "vat_vnd", nullable = false)
    private long vatVnd;

    @Column(name = "total_vnd", nullable = false)
    private long totalVnd;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Invoice() {
    }

    public Invoice(RestaurantOrder order, long subtotalVnd, long discountVnd, long vatVnd, long totalVnd) {
        this.order = order;
        this.subtotalVnd = subtotalVnd;
        this.discountVnd = discountVnd;
        this.vatVnd = vatVnd;
        this.totalVnd = totalVnd;
    }

    public UUID getId() { return id; }
    public RestaurantOrder getOrder() { return order; }
    public long getSubtotalVnd() { return subtotalVnd; }
    public long getDiscountVnd() { return discountVnd; }
    public long getVatVnd() { return vatVnd; }
    public long getTotalVnd() { return totalVnd; }
    public Instant getCreatedAt() { return createdAt; }
}