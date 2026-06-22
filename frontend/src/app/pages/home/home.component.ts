import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MedicineService, Medicine } from '../../services/medicine.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  features = [
    { icon: 'fas fa-pills', title: 'Wide Range', desc: 'Over 10,000+ medicines from 200+ brands available at wholesale prices' },
    { icon: 'fas fa-truck-fast', title: 'Fast Delivery', desc: 'Same day delivery across Darbhanga & next day delivery across Bihar' },
    { icon: 'fas fa-shield-halved', title: 'Quality Assured', desc: '100% genuine medicines sourced directly from authorized distributors' },
    { icon: 'fas fa-tags', title: 'Best Prices', desc: 'Unbeatable wholesale prices with special discounts on bulk orders' },
    { icon: 'fas fa-headset', title: '24/7 Support', desc: 'Round the clock customer support via WhatsApp and phone' },
    { icon: 'fas fa-certificate', title: 'Licensed Store', desc: 'Government licensed wholesale drug store with all certifications' }
  ];

  stats = [
    { number: '10,000+', label: 'Medicines' },
    { number: '500+', label: 'Happy Clients' },
    { number: '15+', label: 'Years Experience' },
    { number: '200+', label: 'Brands' }
  ];

  categories = [
    { name: 'Tablets & Capsules', icon: 'fas fa-capsules', color: '#1a73e8' },
    { name: 'Syrups & Liquids', icon: 'fas fa-flask', color: '#e91e63' },
    { name: 'Injections', icon: 'fas fa-syringe', color: '#ff9800' },
    { name: 'Surgical Items', icon: 'fas fa-kit-medical', color: '#4caf50' },
    { name: 'Ayurvedic', icon: 'fas fa-leaf', color: '#009688' },
    { name: 'OTC Products', icon: 'fas fa-store', color: '#9c27b0' }
  ];

  // Category modal
  showCategoryModal = false;
  selectedCategory = '';
  categoryMedicines: Medicine[] = [];
  isCategoryLoading = false;

  constructor(private medicineService: MedicineService) {}

  openCategory(categoryName: string): void {
    this.selectedCategory = categoryName;
    this.showCategoryModal = true;
    this.isCategoryLoading = true;
    this.categoryMedicines = [];

    this.medicineService.getAll(undefined, categoryName, 1, 100).subscribe({
      next: (medicines) => {
        this.categoryMedicines = medicines;
        this.isCategoryLoading = false;
      },
      error: () => {
        this.isCategoryLoading = false;
      }
    });
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.selectedCategory = '';
    this.categoryMedicines = [];
  }
}
