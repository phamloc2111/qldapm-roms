package com.roms.menu;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {
        return menuService.getCategories().stream().map(CategoryResponse::from).toList();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        return CategoryResponse.from(menuService.createCategory(request.name()));
    }

    @PatchMapping("/categories/{id}")
    public CategoryResponse updateCategory(@PathVariable UUID id, @Valid @RequestBody CategoryRequest request) {
        return CategoryResponse.from(menuService.updateCategory(id, request.name()));
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateCategory(@PathVariable UUID id) {
        menuService.deactivateCategory(id);
    }

    @GetMapping("/menu-items")
    public List<MenuItemResponse> getMenu(@RequestParam(defaultValue = "false") boolean availableOnly) {
        return menuService.getMenu(availableOnly).stream().map(MenuItemResponse::from).toList();
    }

    @PostMapping("/menu-items")
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItemResponse createMenuItem(@Valid @RequestBody MenuItemRequest request) {
        return MenuItemResponse.from(menuService.createMenuItem(request.categoryId(), request.name(),
                request.description(), request.priceVnd(), request.imageUrl()));
    }

    @PatchMapping("/menu-items/{id}")
    public MenuItemResponse updateMenuItem(@PathVariable UUID id, @Valid @RequestBody MenuItemRequest request) {
        return MenuItemResponse.from(menuService.updateMenuItem(id, request.categoryId(), request.name(),
                request.description(), request.priceVnd(), request.imageUrl()));
    }

    @PatchMapping("/menu-items/{id}/availability")
    public MenuItemResponse setAvailability(@PathVariable UUID id, @Valid @RequestBody AvailabilityRequest request) {
        return MenuItemResponse.from(menuService.setAvailability(id, request.available()));
    }

    @DeleteMapping("/menu-items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateMenuItem(@PathVariable UUID id) {
        menuService.deactivateMenuItem(id);
    }

    public record CategoryRequest(@NotBlank String name) { }

    public record CategoryResponse(UUID id, String name, boolean active) {
        static CategoryResponse from(Category category) {
            return new CategoryResponse(category.getId(), category.getName(), category.isActive());
        }
    }

    public record MenuItemRequest(
            @NotNull UUID categoryId,
            @NotBlank String name,
            String description,
            @PositiveOrZero long priceVnd,
            String imageUrl) { }

    public record AvailabilityRequest(boolean available) { }

    public record MenuItemResponse(UUID id, UUID categoryId, String categoryName, String name,
                                   String description, long priceVnd, String imageUrl,
                                   boolean available, boolean active) {
        static MenuItemResponse from(MenuItem item) {
            return new MenuItemResponse(item.getId(), item.getCategory().getId(), item.getCategory().getName(),
                    item.getName(), item.getDescription(), item.getPriceVnd(), item.getImageUrl(),
                    item.isAvailable(), item.isActive());
        }
    }
}