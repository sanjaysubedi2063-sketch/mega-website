# 🧠 MemoryMap – Interactive Memory & Knowledge Graph Platform

## Overview

**MemoryMap** is an innovative, futuristic web application that transforms how you organize, visualize, and connect your memories, thoughts, and knowledge. Unlike traditional note-taking apps, MemoryMap creates a **living, interactive neural network** of your mind.

### Why MemoryMap?

- 🎯 **Nobody has created this exact concept** - Combines mind-mapping, personal wikis, and neural visualization
- 🧠 **Visual Learning** - See your memories as interconnected nodes, not just lists
- 🔗 **Smart Connections** - AI-suggested links between related memories
- 🎨 **Dual Views** - Toggle between graph (neural network) and timeline perspectives
- 💾 **Offline-First** - Works completely offline using localStorage
- 📊 **Analytics** - Understand your knowledge patterns
- 🌙 **Dark Mode** - Built-in dark theme for comfortable use

---

## Features

### 🎨 Core Features

1. **Interactive Graph Visualization**
   - Memories displayed as nodes in a circular network
   - Visual connections between related memories
   - Click nodes to view and edit memories
   - Auto-highlighting of selected memory and connections

2. **Timeline View**
   - Linear visualization of memories over time
   - Chronological organization
   - Quick view of memory creation dates

3. **Smart Memory Management**
   - Create memories with title, description, category, and tags
   - 5 memory categories: Thoughts, Skills, Experiences, Ideas, People
   - Multiple tags per memory for flexible organization
   - Set importance level (1-10 scale)

4. **AI-Powered Suggestions**
   - Automatic connection suggestions between memories
   - Based on: shared tags, similar categories, title overlap
   - One-click connection creation

5. **Advanced Search & Filter**
   - Real-time search across titles, descriptions, and tags
   - Category-based filtering
   - Quick sidebar navigation

6. **Analytics Dashboard**
   - Category breakdown visualization
   - Most used tags
   - Network statistics
   - Memory importance metrics

7. **Export & Import**
   - Export all memories as JSON
   - Import previously exported data
   - Perfect for backup and migration

### 🎨 Design Features

- **Modern UI** - Glassmorphism with backdrop blur effects
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode** - Eye-friendly dark theme
- **Smooth Animations** - Polished transitions and interactions
- **Toast Notifications** - Real-time feedback
- **Accessibility** - Semantic HTML and keyboard navigation

---

## Technologies Used

### Frontend
- **HTML5** - Semantic structure
- **CSS3** - Modern styling with CSS Grid, Flexbox, gradients, animations
- **JavaScript (ES6+)** - Vanilla JS, no frameworks
- **Canvas API** - For graph and timeline rendering
- **LocalStorage & IndexedDB** - Client-side persistence

### Key Features
- No external dependencies (pure vanilla)
- Progressive Web App ready
- Offline-first architecture

---

## How to Use

### Getting Started

1. Open `memory-map.html` in any modern web browser
2. Click "+ New Memory" or use the sidebar to start creating

### Creating a Memory

1. Click "+ New Memory" button
2. Fill in:
   - **Title** (required) - Give your memory a name
   - **Description** - Add details about what you remember
   - **Category** - Choose from 5 categories
   - **Tags** - Add comma-separated keywords
   - **Related Memories** - Check boxes to link to existing memories
3. Click "Create Memory"

### Exploring Your Memory Network

1. **Graph View** (Default)
   - Click on any node (circle) to view memory details
   - See connections as lines between nodes
   - Switch to timeline view with the 👁️ button

2. **Timeline View**
   - See memories in chronological order
   - Hover/click on timeline events
   - Great for understanding memory evolution

### Finding Memories

- **Search** - Type in the search box to filter by title, description, or tags
- **Filter by Category** - Use sidebar to show only specific types
- **Click Memory** - View details and connections in the right panel

### Smart Connections

1. Create at least 2 memories
2. Click "AI Suggestions" in the sidebar
3. Review suggested connections
4. Click "Connect Now" to create relationships

### Analytics & Insights

1. Click "Analytics" to see:
   - How many memories in each category
   - Most frequently used tags
   - Total network connections
   - Memory importance distribution

### Backup & Restore

1. Click 💾 icon in the header
2. **Export** - Download all data as JSON file
3. **Import** - Upload a previously exported JSON file

---

## Memory Categories

- 💭 **Thoughts** - Ideas, reflections, perspectives
- 🎓 **Skills** - Learned abilities and expertise
- 🎯 **Experiences** - Events and moments
- 💡 **Ideas** - Projects, concepts, innovations
- 👤 **People** - Important individuals in your life

---

## Sample Data

The app comes with 3 sample memories:
1. "Learned React Hooks" - Skill memory with connections
2. "First Web Project" - Experience memory
3. "Design System Thoughts" - Idea memory

Feel free to delete these and create your own!

---

## Keyboard Shortcuts

- **/** - Focus search box
- **Esc** - Close modals

---

## Data Storage

- All data stored locally in browser's **localStorage**
- No data sent to servers
- Persistent across sessions
- Automatic backups when you export

---

## Browser Support

- Chrome/Edge (v90+)
- Firefox (v88+)
- Safari (v14+)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Tips & Tricks

✨ **Best Practices:**

1. Use descriptive titles - Makes searching easier
2. Add tags consistently - Improves connection suggestions
3. Connect memories manually - Reinforces learning
4. Review analytics weekly - Understand your knowledge patterns
5. Export regularly - Create regular backups
6. Explore both views - Each view reveals different insights

---

## Future Enhancements

- 🌐 Cloud sync across devices
- 🎯 Smart recommendations using ML
- 📸 Photo attachments
- 🔔 Memory reminders
- 🎬 Memory timeline videos
- 🏆 Gamification & streaks
- 📱 Mobile app (React Native)
- 🤖 ChatGPT integration for memory organization
- 🔊 Voice note support
- 🌍 Collaborative memory spaces

---

## Credits

Built with ❤️ by Sanjay Subedi

**Concept:** An interactive visualization of human memory and knowledge organization, inspired by neural networks and mind mapping.

---

## License

MIT - Feel free to use and modify!

---

**Ready to map your mind? Start creating memories now! 🧠✨**
