# EvalEase Web

A modern Angular application for the Student Subject Evaluation System at STI College Tarlac, built with Angular 18, Tailwind CSS, and best practices.

## Features

- 🎨 **Modern UI**: Built with Tailwind CSS for a clean, responsive design
- ⚡ **Angular 18**: Latest Angular with standalone components
- 🎯 **TypeScript**: Full type safety and modern ES features
- 📱 **Responsive Design**: Mobile-first approach with Tailwind CSS
- 🔒 **Form Validation**: Reactive forms with proper validation
- 🏗️ **Best Practices**: Clean code architecture following Angular guidelines

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:4200/`

## Project Structure

```
src/
├── app/
│   ├── pages/
│   │   └── login/              # Login page component
│   ├── app.component.ts        # Root component
│   └── app.routes.ts           # Route configuration
├── assets/                     # Static assets
├── styles.scss                 # Global styles with Tailwind
└── index.html                  # Entry HTML file
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build and watch for changes
- `npm test` - Run unit tests

## Customization

### Theme Colors

Edit the Tailwind configuration in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#1a237e',
        dark: '#0d1459',
        light: '#3949ab',
      },
      accent: {
        DEFAULT: '#ffc107',
        dark: '#ffb300',
        light: '#ffd54f',
      },
    },
  },
}
```

### Adding New Pages

1. Create a new component in `src/app/pages/`
2. Add a route in `src/app/app.routes.ts`:
   ```typescript
   {
     path: 'your-page',
     loadComponent: () => import('./pages/your-page/your-page.component').then(m => m.YourPageComponent)
   }
   ```

## Technologies Used

- **Angular 18** - Frontend framework
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Programming language
- **RxJS** - Reactive programming
- **PostCSS** - CSS processing

## Development

This project uses Angular's standalone components architecture. All components are self-contained and don't require NgModules.

### Code Style

- Uses `inject()` function for dependency injection (Angular 18 best practice)
- Implements proper TypeScript interfaces for type safety
- Follows Angular style guide conventions
- Uses Tailwind utility classes for styling

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Demo Credentials

The login page includes demo credentials for testing:

- **Registrar**: registrar / registrar123
- **Evaluator**: evaluator / evaluator123
- **Admin**: admin / admin123

## License

This project is part of the EvalEase application suite for STI College Tarlac.
