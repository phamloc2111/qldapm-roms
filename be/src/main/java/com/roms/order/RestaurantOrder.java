package com.roms.order;

import com.roms.table.RestaurantTable;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class RestaurantOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<OrderItem> items = new ArrayList<>();

    protected RestaurantOrder() {
    }

    public RestaurantOrder(RestaurantTable table) {
        this.table = table;
    }

    public UUID getId() {
        return id;
    }

    public RestaurantTable getTable() {
        return table;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public List<OrderItem> getItems() {
        return List.copyOf(items);
    }

    public void addItem(OrderItem item) {
        item.attachTo(this);
        items.add(item);
    }

    public void submit() {
        this.status = OrderStatus.SUBMITTED;
        this.submittedAt = Instant.now();
    }

    public void requestPayment() {
        this.status = OrderStatus.PAYMENT_REQUESTED;
    }

    public void markPaid() {
        this.status = OrderStatus.PAID;
    }

    public void refreshStatus() {
        if (items.isEmpty()) {
            return;
        }
        boolean allServed = items.stream().allMatch(item -> item.getStatus() == OrderItemStatus.SERVED);
        boolean allDoneOrServed = items.stream().allMatch(item ->
                item.getStatus() == OrderItemStatus.DONE || item.getStatus() == OrderItemStatus.SERVED);
        boolean anyStarted = items.stream().anyMatch(item -> item.getStatus() != OrderItemStatus.PENDING);

        if (allServed) {
            status = OrderStatus.SERVED;
        } else if (allDoneOrServed) {
            status = OrderStatus.READY;
        } else if (anyStarted) {
            status = OrderStatus.IN_PROGRESS;
        }
    }
}