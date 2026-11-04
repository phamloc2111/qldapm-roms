package com.roms.table;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TableRepository extends JpaRepository<RestaurantTable, UUID> {
    List<RestaurantTable> findAllByActiveTrueOrderByNameAsc();
}