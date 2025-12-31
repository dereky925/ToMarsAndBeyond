# 🚀 To Mars And Beyond

An 8-bit style SpaceX Starship game where you pilot Starship from Starbase, Texas to the edge of the solar system!

![SpaceX](Assets/SpaceX.png)
<img width="806" height="641" alt="image" src="https://github.com/user-attachments/assets/f340f12d-81bd-4b70-9484-cd705ab18859" />


## 🎮 How to Play

1. **Start**: Tap (mobile) or click (desktop) to launch Starship
2. **Control**: Swipe or move your mouse left/right to dodge obstacles
3. **Collect**: Grab Dogecoins for bonus points (+500 each)
4. **Survive**: Avoid asteroids (lose 1 ❤️) and UFOs (instant game over!)
5. **Reach Milestones**: Hit celestial body milestones for massive bonus points

## 🌟 Features

- **Realistic Launch Sequence**: Watch Starship stack lift off from the tower with booster separation
- **Dynamic Space Environment**: Sunset transition to deep space with parallax stars
- **8-Bit Aesthetics**: Retro pixel art style with chiptune sound effects
- **Progressive Difficulty**: Game speeds up as you travel further
- **Milestone System**: Reach the Moon, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, and Voyager 1!
- **Space Hazards**: Dodge asteroids, UFOs, and watch out for black hole gravity wells
- **Cosmic Scenery**: Shooting stars, galaxies, and alien spacecraft
- **Medal System**: Earn Bronze, Silver, Gold, Diamond, or Legendary status
- **Share Your Score**: Share your achievements with friends

## 🎯 Milestones & Bonuses

| Milestone | Distance | Bonus Points |
|-----------|----------|--------------|
| 🌙 Moon | 384,400 km | 10,000 |
| 🔴 Mars | 225,000,000 km | 50,000 |
| 🟠 Jupiter | 628,730,000 km | 100,000 |
| 🪐 Saturn | 1,275,000,000 km | 150,000 |
| 🔵 Uranus | 2,724,000,000 km | 200,000 |
| 💙 Neptune | 4,351,000,000 km | 250,000 |
| ⚪ Pluto | 5,900,000,000 km | 300,000 |
| 🛸 Voyager 1 | 24,000,000,000 km | 1,000,000 |

## 🏅 Medal Rankings

- 🥉 **Bronze Pilot**: Reached no milestones
- 🥈 **Silver Astronaut**: Reached 1 milestone
- 🥇 **Gold Captain**: Reached 3 milestones
- 💎 **Diamond Commander**: Reached 5 milestones
- 🏆 **Legendary Voyager**: Reached 7+ milestones

## 🛠 Technical Details

- **Pure HTML5/CSS3/JavaScript** - No frameworks or build tools required
- **Canvas-based rendering** with 8-bit pixel art style
- **Procedural 8-bit audio** using Web Audio API
- **Mobile-first responsive design** with touch support
- **Works offline** after initial load (static assets)

## 📁 Project Structure

```
ToMarsAndBeyond/
├── index.html          # Main game page
├── styles.css          # 8-bit themed styles
├── game.js             # Game engine and logic
├── README.md           # This file
└── Assets/
    ├── SpaceX.png      # Logo for start screen
    ├── Starship.png    # Player spacecraft
    ├── Booster.png     # Super Heavy booster
    ├── Tower.png       # Launch tower
    ├── Flames.png      # Rocket exhaust
    ├── Asteroid1-3.png # Obstacle variants
    ├── Dogecoin.png    # Collectible coins
    ├── UFO.png         # Deadly obstacle
    ├── Moon.png        # Milestone
    ├── Mars.png        # Milestone
    ├── Jupiter.png     # Milestone
    ├── Saturn.png      # Milestone
    ├── Uranus.png      # Milestone
    ├── Neptune.png     # Milestone
    ├── Pluto.png       # Milestone
    └── Voyager1.png    # Final milestone
```

## 🚀 Deployment to GitHub Pages

### Option 1: Using GitHub UI

1. Push your code to a GitHub repository
2. Go to **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**
6. Your game will be live at `https://[username].github.io/[repo-name]/`

### Option 2: Using Git Commands

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: To Mars And Beyond game"

# Add your GitHub repo as remote
git remote add origin https://github.com/[username]/ToMarsAndBeyond.git

# Push to main branch
git push -u origin main
```

Then enable GitHub Pages in repository settings.

## 🎨 Assets

The game uses custom pixel art assets located in the `Assets/` folder. All assets are PNG format with transparency for proper layering.

## 🔊 Sound

The game generates 8-bit style sound effects programmatically using the Web Audio API:
- **Launch**: Ascending rocket rumble
- **Boost**: Continuous thrust sound
- **Coin**: Classic collect jingle
- **Hit**: Damage feedback
- **UFO**: Alien encounter
- **Milestone**: Victory fanfare
- **Game Over**: Descending failure tone
- **Separation**: Booster detachment

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome for Android)

## 🎮 Controls

| Platform | Control |
|----------|---------|
| Desktop | Move mouse left/right |
| Mobile | Swipe/drag left/right |
| All | Tap/click to start |

## 📄 License

This is a fan-made game inspired by SpaceX. SpaceX and Starship are trademarks of Space Exploration Technologies Corp.

---

**Made with ❤️ for space exploration enthusiasts**

*To infinity... and beyond!* 🚀
