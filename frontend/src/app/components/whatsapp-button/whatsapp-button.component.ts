import { Component } from '@angular/core';

@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  template: `
    <a class="whatsapp-float"
       href="https://wa.me/918210680066?text=Hi%2C%20I%20have%20a%20query.%20Can%20you%20please%20help%20me%20with%20it"
       target="_blank"
       rel="noopener"
       aria-label="Chat on WhatsApp">
      <i class="fab fa-whatsapp"></i>
    </a>
  `,
  styles: [`
    .whatsapp-float {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      background: #25d366;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2rem;
      box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
      z-index: 9999;
      transition: all 0.3s ease;
      animation: float 3s ease-in-out infinite;

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(37, 211, 102, 0.6);
      }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `]
})
export class WhatsappButtonComponent {}
