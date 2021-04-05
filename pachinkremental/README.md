# Pachinkremental by Poochy.EXE

This game is designed for Firefox or Chrome on desktop. It might work on Safari, but I haven't tested it there yet. It probably won't run very well on mobile.

## How to play

Click anywhere in the drop zone (the green box at the top of the board) to drop a ball.

Click on the "Upgrades", "Stats", and "Options" headers to expand or collapse them.

Hover the mouse cursor over an upgrade button and a tooltip will pop up to tell you what it does.

The rest is for you to discover as you progress!

## FAQs

### Q: Why does the drop zone flash red and green?

A: The drop zone is green when you can drop another ball, and red when you've reached the maximum number of balls allowed on the board at once.

Once you upgrade your auto-drop delay, the drop zone will stop turning red, to avoid really ugly rapid flashing between red and green.

### Q: The balls pass right through each other! Is this a bug?

A: This is intentional, both to make sure the game won't softlock with too many balls clogging up the board and to avoid draining batteries by making the collision detection code too performance-intensive. If you really must, pretend this is a very deep board and the balls are passing in front of or behind each other.

## Known issues

* Making the window too narrow can break some CSS and make the menu UI ugly.
* Firefox seems to occasionally delete the save file upon closing the tab. If you're playing in Firefox, export your save frequently!

## Changelog

### v0.8.1 beta (2021-04-05)
* Add a hint that says when the next upgrade is revealed.
* Fix a bug where you could upgrade things past their max level by clicking really fast.

### v0.8.0 beta (2021-04-05)
* Octo Expansion update! New ball type: 8-Ball!
* Fix dark mode not updating when loading a save file with the opposite setting as your current setting.
* Updated physics engine to also calculate ball rotation.
* Fix Emerald ball upgrade buttons using the Amethyst color when disabled.

### v0.7.2 beta (2021-04-04)
* Fix pegs being too dark to see in dark mode + low quality mode ... except when April Fools is active.
* New effect for Opal balls to make them easier to distinguish from other gemstone balls. You can still use the old style in the options, if you like.

### v0.7.1 beta (2021-04-03)
* New QoL feature: Dark mode! It can be toggled in the options.

### v0.7.0 beta (2021-04-03)
* New upgrade: Make bonus wheel spins play out faster.
* QoL: Add a "New!" indicator that appears when a new upgrade becomes available while the section is collapsed.
* Minor nerf: Bonus wheel ball drops scaling to gemstone ball unlocks are no longer automatic, but need to be purchased as upgrades.

### v0.6.3 beta (2021-04-02)
* Added opacity sliders for each ball type.
* Added the option to keep April Fools' Day mode on all the time.
* Reorganized save file data structure. Note that this means save files exported from this version will not import correctly into older versions -- doing so will reset all your options to defaults. Starting in this version, importing a save from an incompatible future version will fail entirely.
* "Balls dropped manually" stat is now hidden until Auto-Drop is unlocked, since it'll be exactly the same as "Total balls dropped" right above it until then.

### v0.6.2 beta (2021-04-01)
* Optimized performance some more.

### v0.6.1 beta (2021-04-01)
* Happy April Fools' Day! (You can turn the game back to normal in the options.)
* Abbreviate spins earned by sapphire balls in popup text.
* Tweak opal ball coloring to make them easier to distinguish.
* Keep notifications on the top right corner of the window, not the page.

### v0.6.0 beta (2021-03-31)
* Added some upgrades to buff the gemstone balls. (Sapphire's upgrade is significantly cheaper because it was probably the most underpowered previously.)
* Big code refactor. Thanks vadimjprokopev!
* Fixed manual, changelog, and source code links so they open in a new tab.

### v0.5.1 beta (2021-03-31)
* Hopefully fixed the issue that causes the game to start lagging after being open for a while. Thanks a million to /u/Alexandreclalex!

### v0.5.0 beta (2021-03-31)
* New ball type: Opal!
* Buff: Further reduced cost scaling for gemstone ball unlocks.
* Buff: Reduced cost of drop rate upgrades for Topaz, Turquoise, and Amethyst balls.
* Add option to disable some or all pop-up text.

### v0.4.1 beta (2021-03-31)
* Better tooltips on upgrade buttons.
* Better export save UI, which also fixes a bug that would corrupt the exported save when it's too long.
* Overhauled a bunch of the upgrade code to reduce the amount of copy-and-paste code.
* Gemstone ball unlocks now reveal themselves earlier.
* Buff: Reduced cost scaling for gemstone ball unlocks.

### v0.4.0 beta (2021-03-29)
* New feature: 6 types of gemstone balls, which have the value multipiler of gold balls plus additional bonuses.
* Suppress pop-up text when the game is running in the background, to avoid the bug where all the pop-up text accumulates while the tab is inactive and then they all appear at once when you switch back to the tab.
* Various UI tweaks

### v0.3.1 beta (2021-03-27)
* Upgrades are now organized into collapsible sub-sections.
* Cap max balls at 50 since the upgrade becomes useless by that point anyway, due to gold balls not counting against the limit.

### v0.3.0 beta (2021-03-27)
* New feature: Bonus wheel!
* Bugfix: Auto-drop should now work correctly while the game is running in the background.
* Gold balls now create a gold ripple when they're dropped.
* Moved some code from game.js to other files so I don't have a giant monolithic file.

### v0.2.1 beta (2021-03-25)
* Pop-up text is now color-coded:
	* Points scored by regular balls are green.
	* Points scored by gold balls are gold.
	* Slot value increases when buying upgrades are blue.

### v0.2.0 beta (2021-03-25)
* Auto-drop delay upgrade now shows balls/minute.
* Added gold ball value multiplier upgrade.
* Add stats for points earned in the last 5/15/60 seconds.

### v0.1.1 beta (2021-03-25)
* Drop zone now fades between red and green.
* Minor rebalancing buffs:
	* Center slot value upgrade cost halved to reduce slog in the early game.
	* Auto-drop and max balls upgrades reveal their existence earlier.
	* Unlocking auto-drop is no longer a prerequisite for upgrading max balls.

### v0.1.0 beta (2021-03-24)
* Initial version.
* Implemented features so far:
	* Realistic(ish) physics engine written from scratch
	* Code optimized(ish) so it hopefully doesn't drain batteries
	* Board automatically resizes to fit window
	* Upgrades:
		* Score value increases
		* Auto-drop with speed upgrade
		* Multiple balls at once
		* Gold balls with rate upgrade
	* Stats tracking
	* Configurable quality level