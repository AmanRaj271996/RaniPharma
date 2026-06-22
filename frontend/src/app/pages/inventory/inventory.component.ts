import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicineService, Medicine, MedicineCreate, InventoryStats } from '../../services/medicine.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit {
  medicines: Medicine[] = [];
  stats: InventoryStats | null = null;
  searchTerm = '';
  isLoading = false;
  showModal = false;
  editingMedicine: Medicine | null = null;

  formData: MedicineCreate = {
    name: '',
    manufacturer: '',
    category: '',
    batchNumber: '',
    price: 0,
    stockQuantity: 0,
    expiryDate: ''
  };

  categories = [
    'Tablets & Capsules', 'Syrups & Liquids', 'Injections',
    'Surgical Items', 'Ayurvedic', 'OTC Products', 'Others'
  ];

  constructor(private medicineService: MedicineService) {}

  ngOnInit(): void {
    this.loadMedicines();
    this.loadStats();
  }

  loadMedicines(): void {
    this.isLoading = true;
    this.medicineService.getAll(this.searchTerm).subscribe({
      next: (data) => {
        this.medicines = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadStats(): void {
    this.medicineService.getStats().subscribe({
      next: (data) => this.stats = data
    });
  }

  search(): void {
    this.loadMedicines();
  }

  openAddModal(): void {
    this.editingMedicine = null;
    this.formData = {
      name: '', manufacturer: '', category: '',
      batchNumber: '', price: 0, stockQuantity: 0, expiryDate: ''
    };
    this.showModal = true;
  }

  openEditModal(medicine: Medicine): void {
    this.editingMedicine = medicine;
    this.formData = {
      name: medicine.name,
      manufacturer: medicine.manufacturer,
      category: medicine.category,
      batchNumber: medicine.batchNumber,
      price: medicine.price,
      stockQuantity: medicine.stockQuantity,
      expiryDate: medicine.expiryDate.split('T')[0]
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingMedicine = null;
  }

  saveMedicine(): void {
    if (this.editingMedicine) {
      this.medicineService.update(this.editingMedicine.id, this.formData).subscribe({
        next: () => {
          this.closeModal();
          this.loadMedicines();
          this.loadStats();
        }
      });
    } else {
      this.medicineService.create(this.formData).subscribe({
        next: () => {
          this.closeModal();
          this.loadMedicines();
          this.loadStats();
        }
      });
    }
  }

  deleteMedicine(id: number): void {
    if (confirm('Are you sure you want to delete this medicine?')) {
      this.medicineService.delete(id).subscribe({
        next: () => {
          this.loadMedicines();
          this.loadStats();
        }
      });
    }
  }
}
