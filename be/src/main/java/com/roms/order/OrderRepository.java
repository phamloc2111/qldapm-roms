package com.roms.order;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<RestaurantOrder, UUID> {
    List<RestaurantOrder> findAllByStatusInOrderBySubmittedAtAsc(Collection<OrderStatus> statuses);
    List<RestaurantOrder> findAllByStatusOrderBySubmittedAtAsc(OrderStatus status);
    Optional<RestaurantOrder> findFirstByTable_IdAndStatusIn(UUID tableId, Collection<OrderStatus> statuses);
}