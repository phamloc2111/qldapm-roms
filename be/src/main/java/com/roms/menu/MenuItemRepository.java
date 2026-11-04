package com.roms.menu;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findAllByActiveTrueAndCategory_ActiveTrueOrderByNameAsc();
    List<MenuItem> findAllByActiveTrueAndCategory_ActiveTrueAndAvailableTrueOrderByNameAsc();
}