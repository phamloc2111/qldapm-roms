package com.roms.table;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @GetMapping
    public List<TableResponse> getTables() {
        return tableService.getTables().stream().map(TableResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TableResponse create(@Valid @RequestBody TableRequest request) {
        return TableResponse.from(tableService.create(request.name(), request.capacity()));
    }

    @PatchMapping("/{id}")
    public TableResponse update(@PathVariable UUID id, @Valid @RequestBody TableRequest request) {
        return TableResponse.from(tableService.update(id, request.name(), request.capacity()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        tableService.deactivate(id);
    }

    public record TableRequest(@NotBlank @Size(max = 30) String name, @Min(1) int capacity) { }

    public record TableResponse(UUID id, String name, int capacity, TableStatus status, boolean active) {
        static TableResponse from(RestaurantTable table) {
            return new TableResponse(table.getId(), table.getName(), table.getCapacity(),
                    table.getStatus(), table.isActive());
        }
    }
}