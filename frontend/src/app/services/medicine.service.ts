import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface Medicine {
  id: number;
  name: string;
  manufacturer: string;
  category: string;
  batchNumber: string;
  price: number;
  stockQuantity: number;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface MedicineCreate {
  name: string;
  manufacturer: string;
  category: string;
  batchNumber: string;
  price: number;
  stockQuantity: number;
  expiryDate: string;
}

export interface InventoryStats {
  totalMedicines: number;
  lowStock: number;
  expiringSoon: number;
  totalInventoryValue: number;
}

@Injectable({ providedIn: 'root' })
export class MedicineService {
  private readonly apiUrl = `${environment.apiUrl}/medicine`;

  constructor(private http: HttpClient) {}

  getAll(search?: string, category?: string, page = 1, pageSize = 20): Observable<Medicine[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);

    return this.http.get<Medicine[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Medicine> {
    return this.http.get<Medicine>(`${this.apiUrl}/${id}`);
  }

  create(medicine: MedicineCreate): Observable<Medicine> {
    return this.http.post<Medicine>(this.apiUrl, medicine);
  }

  update(id: number, medicine: Partial<Medicine>): Observable<Medicine> {
    return this.http.put<Medicine>(`${this.apiUrl}/${id}`, medicine);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  getStats(): Observable<InventoryStats> {
    return this.http.get<InventoryStats>(`${this.apiUrl}/stats`);
  }
}
