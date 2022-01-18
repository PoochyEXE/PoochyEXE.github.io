# Pachinkremental by Poochy.EXE

Pachinkremental is a pachinko-based incremental browser game. It's designed for Firefox or Chrome on desktop, although it seems to run noticeably smoother in Chrome than Firefox. The UI will probably be rather clunky on mobile, but otherwise the game appears to run fine on mobile devices in both Safari and Chrome.

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

### Q: Will there be a Prestige/New Game+ mechanic?

A: I'm not saying it'll never happen, but I currently have no plans to add a prestige mechanic. I designed this game around discovering new features and mechanics as the main fun factor, drawing inspiration from games like Candy Box. I've yet to come up with a way to fit a prestige mechanic into that vision. But if you have ideas, I'll gladly listen.

## Known issues

* Making the window too narrow can break some CSS and make the menu UI ugly.
* The ball opacity options don't work in Firefox, due to [a known bug with Firefox's implementation of the Canvas 2D API](https://bugzilla.mozilla.org/show_bug.cgi?id=1164912).
* Firefox seems to occasionally delete the save file upon closing the tab. If you're playing in Firefox, export your save frequently!

## Archived versions

I plan to archive the last version before any update that significantly nerfs previous content or renders previous save files incompatible, so that the old version is still easily accessible to people who want to keep playing it. Below is the list of archived versions.

* [v0.12.2 beta](https://poochyexe.github.io/pachinkremental/archive/beta_0/pachinkremental.html)

## Changelog

**Caution: Spoilers below!**

### v2.0.16 (2022-01-18)
* Fix non-integer values between 1,000 and 10,000 being displayed in scientific notation when Notation is set to 漢字.

### v2.0.15 (2022-01-11)
* Add option to automatically reset hit rate stats when changing the Auto-Drop location.

### v2.0.14 (2021-12-03)
* More performance optimizations to reduce the amount of repainting the browser has to do.
* Migrate to `requestAnimationFrame` and `performance.now()` for timing. I've been procrastinating on this one for way too long as well.
* Basic machine: Adjust pop-up text color when buying Point Multiplier and Center Slot Value upgrade in dark mode.

### v2.0.13 (2021-11-24)
* Optimize code that renders the Spiral Power meter.
* Fix an off-by-one bug when computing how many cells of the Spiral Power meter should be lit.

### v2.0.12 (2021-11-24)
* Refactor code for options and machine-specific stats to make it easier to add new ones.
* Add stat for points earned by the Bonus Wheel in the Basic machine.
* Reorder the Gemstone ball stats in the Bumpers machine to match the order of the balls in the upgrades menu.
* Fix a bug where some stats took a while to re-appear in the Stats panel after switching back to a previously played machine.
* Fix a hit rate of 0 showing as "NaN" for bumpers.
* Fix top-level collapsible headers (Upgrades, Machines, Stats, and Options) not restoring to their saved collapsed/open states when loading a save file.

### v2.0.9 (2021-11-22)
* Make the board glow based on Hyper System and Overdrive status. This can be turned off in the options.
* Refactor the code and remove some redundant operations to make the game slightly faster at loading, switching machines, and loading save files.

### v2.0.8 (2021-11-22)
* When starting a new save file, try to guess whether the player prefers light or dark mode based on system settings and automatically turn dark mode on/off accordingly.

### v2.0.7 (2021-11-20)
* Refactor and optimize code for rendering Opal and Ultimate balls and use HSL color space for them.

### v2.0.6 (2021-11-16)
* Bumpers machine: Add "Opal+ only" and "Ultimate only" pop-up text options.
* Optimize Spiral Power meter drawing code by caching individual cell colors.

### v2.0.5 (2021-11-12)
* Fix a bug where the game has a CPU spike and freezes for a bit when script execution resumes after being paused for a while (e.g. switching back to the tab).
* Refactor some of the machine-specific feature code (Bonus Wheel, Hyper System, and Spiral Power) to make it easier to add new machines in the future.
* Optimize compression on the Rubber Band and Spiral Ball favicons. (Which only saves 1.5 KB of loading, but whatever.)

### v2.0.4 (2021-11-12)
* Fix bug where hit rates are broken if a target has never been hit.

### v2.0.3 (2021-11-11)
* Fix another bug where save file corruption could cause break an upgrade button, and clicking it would spend the points without actually buying the upgrade.

### v2.0.2 (2021-11-11)
* Fix a bug where save file corruption could cause an upgrade to display as "Unlocked!" when it hasn't been purchased yet.

### v2.0.1 (2021-11-11)
* Adjust buttons for Rubber Band Balls and Spiral Balls to make the text more readable.

### v2.0.0 (2021-11-11)
* **Major new feature: A second machine!**
* Minor nerf: Rate-limit manual drops so that hypertapping/mashing the mouse button doesn't become the optimal strategy.
* QoL improvements:
	* Hold Shift to buy as many levels of an upgrade as you can, in one click.
	* Add alternate non-animated style for Opal ball upgrade buttons, toggleable in the options.
	* Shrink buttons for maxed upgrades, with an option to revert to the old behavior and keep them at full size.
	* Save file now saves which collapsible headers are collapsed, and will restore them to their previous state when loading or switching between machines.
	* Adjust pop-up text color when buying Point Multiplier upgrade in dark mode.
	* Add option to apply opacity settings to pop-up text.
	* Add engineering and 漢字 (Japanese kanji) notations.
	* Add extra protections against save file corruption.
	* Minor improvements to the way the game handles a corrupted save file.
* Stats panel improvements:
	* Add stats to track points scored by each ball type, both all-time and in the last 5/15/60 seconds.
	* Add toggle in stats panel to show how often each target or slot is hit.
	* Show time since save file was started and time taken (since the save file was started) to max each machine.
	* Add stats for longest-lasting Beach Ball and most rotations by a Beach Ball.
* Massive under-the-hood refactor of the game engine, including plenty of performance optimizations:
	* Optimize the physics engine to reduce memory churn there.
	* Use object pooling to reduce memory churn further.
	* Optimize the code for rendering Beach Balls, in particular caching the color palette.
	* Improve performance by being smarter about what parts of upgrade buttons need to be updated, instead of re-rendering everything every time something changes.
* Bug fixes:
	* Require buying Better Ball Drops 2 before showing Better Ball Drops 3, and likewise buying 3 before showing 4.
	* Fix Auto-Spin making the "Spin the wheel!" button flicker.
	* Fix upgrade tooltips sometimes going partially off-screen.
* Other minor adjustments:
	* Add invisible walls above the sides of the board, so that if a ball bounces wildly off a bumper and over one of the top corner pegs, it'll bounce back into play instead of simply despawning due to going out of bounds.
	* Keep the board on-screen when scrolling down, if enough headers are expanded to exceed the height of the screen.
	* Move the Gold Balls upgrades above Bonus Wheel upgrades in the Basic machine, now that shrinking maxed upgrade buttons means Board, Auto-Drop and Gold Balls upgrades can fit neatly in one row on a standard HD display (1360x768 or 1366x768).
	* Trim trailing zeros in significand in scientific notation.
	* Change the look of the "Spin the wheel!" button.
	* Add a modal for when you max out a machine, to make it a bit more clear that the next step is to move on to the next machine.

### v1.1.2 (2021-05-09)
* Make bonus wheel pop-up text easier to read.
* Fix 8-ball upgrade buttons still having white text when disabled in light mode.

### v1.1.1 (2021-05-03)
* Fix drop zone being drawn 5 pixels too high in April Fools mode.

### v1.1.0 (2021-04-30)
* Add a rotation-based multiplier for beach balls.

### v1.0.1-RC2 (2021-04-26)
* Add a beta version, for testing future updates. Live version save files can be imported into the beta, but beta version saves cannot be imported back into the live version.
* Tweaked a couple pop-up text colors in dark mode to make them easier to read.
* Fixed 2.4x wheel speed being displayed as "2.40x".

### v1.0.0-RC1 (2021-04-13)
* Pachinkremental is out of beta!
* Lots of rebalancing. In order by game progression:
	* Nerf: Lower the max Gold ball rate to 15%.
	* Buff: Raise the max Gemstone ball rates to 10%.
	* Buff: Gemstone and higher ball rate upgrades now increase by 0.2% per upgrade level instead of 0.1%.
	* Buff: Reduced cost of Synergy upgrades.
	* Nerf: Raise the costs of Better Buff Multiplier, Better Point Values, and Better Multi-Spin based on how powerful they are.
	* Nerf: 8-Ball Score Exponent is now an exponent on the 8-Ball's 8x multiplier instead of the gold ball value multiplier.
	* Nerf: Disabled the 8-Ball Spin Exponent upgrade entirely. It was way too powerful when combined with Better Point Values.
	* Buff: Reduced cost of Beach Ball unlock and upgrades.
	* Nerf: Reduced max Beach Ball Score Exponent from 10 to 2.
* New "Congratulations!" modal when you max every upgrade that can be maxed.
* Make Dark Mode apply to modals as well.

### v0.12.1 beta (2021-04-12)
* Fix exploit where Beach Ball timer could be extended by pausing script execution (e.g. minimizing the window or switching away from the tab). Thanks to Leidwesen for the bug report!
* Add scientific notation.
* Fix "Highest buff multiplier" stat showing 1x instead of 2x if the buff hasn't stacked before.

### v0.12.0 beta (2021-04-11)
* Add a couple more upgrades for Beach Balls, aimed at balancing points from the center slot with points from the bonus wheel in the late game.

### v0.11.2 beta (2021-04-11)
* Add more names for numbers up to 10^120.

### v0.11.1 beta (2021-04-11)
* Several bugfixes. Thanks to Leidwesen for the bug reports!
	* Fix both 8-Ball exponent upgrades not working properly.
	* Fix Beach Ball not applying the 8-Ball's 8x spins.
	* Fix 8-Ball and Beach Ball scoring text not displaying when pop-up text is set to "8-Ball+ only".

### v0.11.0 beta (2021-04-11)
* Change 8-Ball Exponent to be a gradual upgrade, instead of jumping from 3 straight to 8, and rename it to "8-Ball Score Exponent". Note: Importing a save file from a previous version will reset this upgrade's level.
* New upgrades!
	* Synergy upgrades for Topaz, Turquoise, and Amethyst balls.
	* Add 8-Ball Spin Exponent upgrade.
* Refactor a bunch of code to reduce the amount of boilerplate I have to write when adding a new ball type or collapsible section in the upgrades menu.
* Tweak physics engine to detect if a ball is (or about to be) stuck by being perfectly balanced on top of a peg, and give the ball a tiny random nudge. (This was theoretically possible but so incredibly unlikely that I doubt anyone's actually encountered it in normal play. Still, I was able to get a ball stuck by hacking the RNG to return specific values, so better safe than sorry.)

### v0.10.0 beta (2021-04-08)
* New ball type: Beach balls! They're bouncier and floatier than other ball types.
* Add another Bonus Wheel upgrade.
* Add "8-Ball+" choice for pop-up text display option.

### v0.9.0 beta (2021-04-08)
* Add 3 new Bonus Wheel upgrades.
* Add a new 8-Ball upgrade.
* Format the spin counter.

### v0.8.5 beta (2021-04-08)
* Add favicon. By default it's automatically set to the highest ball type you have unlocked, but you can manually go into the options and pick any of the balls you have unlocked.
* Fix classic opal balls option button, which I accidentally broke in v0.8.3. Oops!

### v0.8.4 beta (2021-04-07)
* More UI decluttering, by changing "Unlock X" buttons to remove the "Unlock" once bought. (The grayed-out button remains so that you can still see the tooltip text.)
* Make the save export modal automatically highlight the full save file when you click on the text box. Also tweaked it to look better.
* Bugfix: Clear balls on the board when importing a save file.
* Bugfix: Update buff display when importing a save file that doesn't have a buff active.

### v0.8.3 beta (2021-04-07)
* Fix color of pop-up text for spins earned by 8-Balls.
* Made the upgrade panel UI more compact:
	* Hide "Bought:" counter on upgrade buttons to reduce UI clutter. You can turn them back on in the options if you want.
	* Stop forcing new rows between certain upgrade buttons.

### v0.8.2 beta (2021-04-06)
* Fix score multiplier buff not being applied to points won from spinning the bonus wheel.
* Tweak brightness of grayed-out buttons so they're easier to tell apart from a buyable 8-ball upgrade.

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
* New feature: 6 types of gemstone balls, which have the value multiplier of gold balls plus additional bonuses.
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