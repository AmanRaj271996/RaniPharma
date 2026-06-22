import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  milestones = [
    { year: '2009', title: 'Founded', desc: 'Started as a small medical supply shop in Alalpatti, Darbhanga' },
    { year: '2013', title: 'Expansion', desc: 'Expanded to wholesale distribution serving 100+ pharmacies' },
    { year: '2018', title: 'Digitization', desc: 'Adopted digital inventory management & online ordering' },
    { year: '2024', title: 'Growth', desc: 'Now serving 500+ clients across Bihar with 10,000+ products' }
  ];

  values = [
    { icon: 'fas fa-heart', title: 'Trust', desc: 'Building lasting relationships with transparency and honesty' },
    { icon: 'fas fa-gem', title: 'Quality', desc: 'Only genuine medicines from authorized manufacturers' },
    { icon: 'fas fa-handshake', title: 'Service', desc: 'Going above and beyond for every customer' },
    { icon: 'fas fa-rocket', title: 'Innovation', desc: 'Embracing technology for better healthcare delivery' }
  ];
}
