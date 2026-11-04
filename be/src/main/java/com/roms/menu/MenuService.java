package com.roms.menu;

import com.roms.realtime.RealtimeEventService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class MenuService {

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final RealtimeEventService realtimeEventService;

    public MenuService(CategoryRepository categoryRepository, MenuItemRepository menuItemRepository,
                       RealtimeEventService realtimeEventService) {
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
        this.realtimeEventService = realtimeEventService;
    }

    @Transactional(readOnly = true)
    public List<Category> getCategories() {
        return categoryRepository.findAllByActiveTrueOrderByNameAsc();
    }

    public Category createCategory(String name) {
        return categoryRepository.save(new Category(name.trim()));
    }

    public Category updateCategory(UUID id, String name) {
        Category category = findCategory(id);
        category.updateName(name.trim());
        return category;
    }

    public void deactivateCategory(UUID id) {
        findCategory(id).deactivate();
    }

    @Transactional(readOnly = true)
    public List<MenuItem> getMenu(boolean availableOnly) {
        return availableOnly
                ? menuItemRepository.findAllByActiveTrueAndCategory_ActiveTrueAndAvailableTrueOrderByNameAsc()
                : menuItemRepository.findAllByActiveTrueAndCategory_ActiveTrueOrderByNameAsc();
    }

    public MenuItem createMenuItem(UUID categoryId, String name, String description, long priceVnd, String imageUrl) {
        Category category = findCategory(categoryId);
        return menuItemRepository.save(new MenuItem(category, name.trim(), description, priceVnd, imageUrl));
    }

    public MenuItem updateMenuItem(UUID id, UUID categoryId, String name, String description,
                                   long priceVnd, String imageUrl) {
        MenuItem item = findMenuItem(id);
        item.update(findCategory(categoryId), name.trim(), description, priceVnd, imageUrl);
        return item;
    }

    public MenuItem setAvailability(UUID id, boolean available) {
        MenuItem item = findMenuItem(id);
        item.setAvailable(available);
        realtimeEventService.menuAvailabilityChanged(item.getId(),
            new AvailabilityChanged(item.getId(), item.getName(), item.isAvailable()));
        return item;
    }

    public void deactivateMenuItem(UUID id) {
        findMenuItem(id).deactivate();
    }

    private Category findCategory(UUID id) {
        return categoryRepository.findById(id)
                .filter(Category::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"));
    }

    private MenuItem findMenuItem(UUID id) {
        return menuItemRepository.findById(id)
                .filter(MenuItem::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn"));
    }

    public record AvailabilityChanged(UUID menuItemId, String name, boolean available) { }
}