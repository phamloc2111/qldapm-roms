package com.roms.table;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class TableService {

    private final TableRepository tableRepository;

    public TableService(TableRepository tableRepository) {
        this.tableRepository = tableRepository;
    }

    @Transactional(readOnly = true)
    public List<RestaurantTable> getTables() {
        return tableRepository.findAllByActiveTrueOrderByNameAsc();
    }

    public RestaurantTable create(String name, int capacity) {
        return tableRepository.save(new RestaurantTable(name.trim(), capacity));
    }

    public RestaurantTable update(UUID id, String name, int capacity) {
        RestaurantTable table = findActiveTable(id);
        table.update(name.trim(), capacity);
        return table;
    }

    public void deactivate(UUID id) {
        RestaurantTable table = findActiveTable(id);
        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể tắt bàn đang có khách");
        }
        table.deactivate();
    }

    private RestaurantTable findActiveTable(UUID id) {
        return tableRepository.findById(id)
                .filter(RestaurantTable::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bàn"));
    }
}