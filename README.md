# Work Hours Tracker

A modern, user-friendly application for tracking and managing work hours. Built with Next.js, React, TypeScript, and Tailwind CSS.

![Work Hours Tracker](https://via.placeholder.com/800x400?text=Work+Hours+Tracker)

## Features

### Current Features

#### Time Entry Management
- **Single Entry Mode**: Quickly add individual work periods with date, start time, end time, and break duration
- **Batch Entry Mode**: Add multiple work entries at once for efficient data entry
- **Edit Entries**: Modify any entry's details after creation
- **Delete Entries**: Remove unwanted entries from your records
- **Duplicate Entries**: Easily copy existing entries to create similar ones

#### Time Calculations
- **Automatic Hour Calculation**: Hours worked are automatically calculated based on start time, end time, and breaks
- **Quarter Hour Rounding**: Support for quarter-hour billing/reporting with automatic rounding
- **Break Time Tracking**: Record and account for break times in your work periods

#### Summary Statistics
- **Total Hours**: View the sum of all recorded work hours
- **Total Quarter Hours**: See the total quarter hours for billing purposes
- **Total Break Time**: Track accumulated break time across all entries

#### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS and shadcn/ui components
- **Tabbed Interface**: Easy switching between single and batch entry modes
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing in any environment

#### Data Persistence
- **Local Storage**: Save your work entries between browser sessions
- **CSV Export**: Export your time entries as CSV files for use in spreadsheets or other applications

#### Data Visualization
- **Daily Hours Chart**: Bar chart showing hours worked and break time for each day
- **Weekly Pattern Analysis**: Line chart displaying average hours worked by day of the week
- **Break Time Analysis**: Pie chart showing the proportion of work time vs. break time
- **Theme-Aware Charts**: Visualizations that automatically adapt to light and dark themes

### Upcoming Features

#### Enhanced Data Management
- **Data Import**: Import existing time records from CSV files
- **Filtering & Sorting**: Find specific entries by date, duration, or other criteria
- **Tags/Categories**: Categorize work entries by project or activity type

#### Advanced Visualization
- **Calendar View**: See your work hours in a calendar format
- **Weekly/Monthly Reports**: Automatically generated summaries of work periods

#### Additional Features
- **Recurring Entries**: Set up templates for regular work schedules
- **Notifications**: Reminders for tracking work time
- **Multi-language Support**: Interface available in multiple languages

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/work-hours-table.git

# Navigate to the project directory
cd work-hours-table

# Install dependencies
npm install
```

### Running the Application

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building for Production

```bash
# Create a production build
npm run build

# Start the production server
npm start
```

## Technologies Used

- **Next.js**: React framework for production
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Reusable UI components
- **Radix UI**: Accessible UI primitives
- **Recharts**: Composable chart library for React
- **Lucide React**: Beautiful SVG icons
- **date-fns**: Date utility library
- **next-themes**: Theme management for Next.js

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
