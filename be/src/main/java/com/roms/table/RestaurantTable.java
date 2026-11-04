package com.roms.table;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "restaurant_tables")
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String name;

    @Column(nullable = false)
    private int capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TableStatus status = TableStatus.AVAILABLE;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    protected RestaurantTable() {
    }

    public RestaurantTable(String name, int capacity) {
        this.name = name;
        this.capacity = capacity;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getCapacity() {
        return capacity;
    }

    public TableStatus getStatus() {
        return status;
    }

    public boolean isActive() {
        return active;
    }

    public void update(String name, int capacity) {
        this.name = name;
        this.capacity = capacity;
    }

    public void deactivate() {
        this.active = false;
    }

    public void updateStatus(TableStatus status) {
        this.status = status;
    }
}