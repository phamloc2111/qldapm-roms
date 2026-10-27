package com.roms.order;

import com.roms.menu.MenuItem;
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
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private RestaurantOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(name = "item_name", nullable = false, length = 120)
    private String itemName;

    @Column(name = "unit_price_vnd", nullable = false)
    private long unitPriceVnd;

    @Column(nullable = false)
    private int quantity;

    @Column(length = 300)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderItemStatus status = OrderItemStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected OrderItem() {
    }

    public OrderItem(MenuItem menuItem, int quantity, String note) {
        this.menuItem = menuItem;
        this.itemName = menuItem.getName();
        this.unitPriceVnd = menuItem.getPriceVnd();
        this.quantity = quantity;
        this.note = note;
    }

    public UUID getId() {
        return id;
    }

    public RestaurantOrder getOrder() {
        return order;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public String getItemName() {
        return itemName;
    }

    public long getUnitPriceVnd() {
        return unitPriceVnd;
    }

    public int getQuantity() {
        return quantity;
    }

    public String getNote() {
        return note;
    }

    public OrderItemStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void attachTo(RestaurantOrder order) {
        this.order = order;
    }

    public void startCooking() {
        this.status = OrderItemStatus.COOKING;
    }

    public void complete() {
        this.status = OrderItemStatus.DONE;
    }

    public void serve() {
        this.status = OrderItemStatus.SERVED;
    }
}