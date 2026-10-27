package com.roms.menu;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "price_vnd", nullable = false)
    private long priceVnd;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "is_available", nullable = false)
    private boolean available = true;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    protected MenuItem() {
    }

    public MenuItem(Category category, String name, String description, long priceVnd, String imageUrl) {
        this.category = category;
        this.name = name;
        this.description = description;
        this.priceVnd = priceVnd;
        this.imageUrl = imageUrl;
    }

    public UUID getId() {
        return id;
    }

    public Category getCategory() {
        return category;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public long getPriceVnd() {
        return priceVnd;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public boolean isAvailable() {
        return available;
    }

    public boolean isActive() {
        return active;
    }

    public void update(Category category, String name, String description, long priceVnd, String imageUrl) {
        this.category = category;
        this.name = name;
        this.description = description;
        this.priceVnd = priceVnd;
        this.imageUrl = imageUrl;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public void deactivate() {
        this.active = false;
    }
}