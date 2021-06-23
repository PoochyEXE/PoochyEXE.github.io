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

## Known issues

* Making the window too narrow can break some CSS and make the menu UI ugly.
* The ball opacity options don't work in Firefox.
* Firefox seems to occasionally delete the save file upon closing the tab. If you're playing in Firefox, export your save frequently!

## Archived versions

I plan to archive the last version before any update that significantly nerfs previous content or renders previous save files incompatible, so that the old version is still easily accessible to people who want to keep playing it. Below is the list of archived versions.

* [v0.12.2 beta](https://poochyexe.github.io/pachinkremental/archive/beta_0/pachinkremental.html)

## Changelog

**Caution: Spoilers below!**

### v1.10.0-beta (2021-06-23)
* Add Beach Balls to Bumpers machine.
* Add 3 more Overdrive upgrades.
* Buff: Reduced costs of Overdrive upgrades.
* Fix score multiplier display precision flickering between 1 decimal place and rounding to the nearest integer during a Hyper Combo.
* Add invisible walls above the sides of the board, so that if a ball bounces wildly off a bumper and over one of the top corner pegs, it'll bounce back into play instead of simply despawning due to going out of bounds.
* Remove an extraneous peg in the right wall of the Bumpers machine.

### v1.9.2-beta (2021-06-19)
* Fix point value text on score targets not updating when switching notations.

### v1.9.1-beta (2021-06-11)
* Fix game crashing when trying to load a save file that was saved while Overdrive was active.

### v1.9.0-beta (2021-06-10)
* Add Overdrive upgrades, which kick in when the Hyper Combo is over 1000 hits.

### v1.8.1-beta (2021-06-07)
* Fix upgrade tooltips sometimes going partially off-screen.
* Make the Hyper Combo counter fade out when the Hyper System activation time runs out.

### v1.8.0-beta (2021-06-06)
* New Hyper System upgrade: Hyper Combo. The more hits scored in a single Hyper activation, the higher the multiplier goes!
* Minor nerf: Rate-limit manual drops so that hypertapping/mashing the mouse button during a Hyper activation doesn't become the optimal strategy.

### v1.7.8-beta (2021-06-02)
* Fix CSS breaking on collapsible headers when importing a save from v1.1.1 or older directly into v1.7.6 or newer.
* Show time since save file was started and time taken (since the save file was started) to max each machine in the Stats panel.

### v1.7.7-beta (2021-06-02)
* Add stats for highest combo and number of times the Hyper System has been activated.

### v1.7.6-beta (2021-06-02)
* Save file now saves which collapsible headers are collapsed, and will restore them to their previous state when loading or switching between machines.
* Fix the "New!" notice always appearing in the Upgrades header if it's collapsed when switching machines, even when switching to a machine where none of the upgrades are newly revealed.

### v1.7.5-beta (2021-06-01)
* Buff: Make Bumper Value increase twice as fast after 500, since its cost-effectiveness becomes pretty rubbish in the late game. (It's still pretty underpowered in the late game, just less so.)
* Add stats for points earned in the last 5/15/60 seconds by ball type.
* Fix stats panel displaying "Highest buff multiplier: ×0" when switching machines from Basic to Bumpers.

### v1.7.4-beta (2021-05-30)
* Add extra protections against save file corruption.
* Minor improvements to the way the game handles a corrupted save file.

### v1.7.3-beta (2021-05-30)
* Refactored the code and optimized the engine a bit.
* Fix "Next upgrade reveal at:" messages for Bumpers machine.

### v1.7.2-beta (2021-05-29)
* Fix popup text not appearing when buying Point Multiplier or Center Slot Value upgrades.
* Add engineering and 漢字 (Japanese kanji) notations.

### v1.7.1-beta (2021-05-28)
* Add upgrades for the Hyper System's score multiplier and charge rate.

### v1.7.0-beta (2021-05-27)
* Bumpers machine updates:
	* Add an upgrade to combos which makes the base value accumulate with each hit.
	* New feature: Hyper System, which is charged up by combos and awards a 10x score buff for 15 seconds when fully charged.
* Change the look of the "Spin the wheel!" button.
* Fix Auto-Spin making the "Spin the wheel!" button flicker.

### v1.6.0-beta (2021-05-25)
* Bumpers machine updates:
	* New feature: Combos!
	* Increase max Bumper Value and lower the cost of upgrading it.
	* Add upgrades that increase the value of the middle score targets and the bottom slots.
* Change "Pop-up text for opacity 0 balls" option to "Apply opacity settings to pop-up text", making it apply non-zero opacity settings to pop-up text.

### v1.5.1-beta (2021-05-21)
* Lower prices for Add Score Targets, Gold Ball Rate, and Gold Ball Value upgrades on Bumpers machine.

### v1.5.0-beta (2021-05-19)
* Bumpers machine updates:
	* Buff: Double Ruby ball value increase per second.
	* Add an upgrade that adds 5 more blue score targets.

### v1.4.7-beta (2021-05-18)
* Add stats to track points scored by each ball type.
* Tweak the logic that computes stats for points scored in the last 5/15/60 seconds to (hopefully) make the time window cutoffs more accurate when lagging or inactive.

### v1.4.6-beta (2021-05-15)
* Add option to hide pop-up text for balls set to opacity 0.

### v1.4.5-beta (2021-05-13)
* Reduce price of Opal Ball Rate upgrade in Bumper machine.

### v1.4.4-beta (2021-05-12)
* Shrink buttons for maxed upgrades, with an option to revert to the old behavior and keep them at full size.
* Move the Gold Balls upgrades above Bonus Wheel upgrades in the Basic machine, now that shrinking maxed upgrade buttons means Board, Auto-Drop and Gold Balls upgrades can fit neatly in one row on a standard HD display (1360x768 or 1366x768).

### v1.4.3-beta (2021-05-12)
* Adjust bumper physics so that when a bumper sends a ball flying into another bumper, the ball doesn't ricochet as wildly off the second bumper.
* Adjust pop-up text color when buying Point Multiplier upgrade in dark mode.
* Reduce gold ball value upgrade price for the Bumpers machine.
* Tweak gemstone ball note to say that "each" gemstone ball unlocked increases the cost of the others.
* Fix Better Multi-Spin not working (broken in v1.2.0-beta).

### v1.4.2-beta (2021-05-11)
* Reduce a bunch of upgrade prices for the Bumpers machine.
* Fix some wheel spaces appearing blank before the first spin after switching machines.

### v1.4.1-beta (2021-05-10)
* Fix some targets not updating their text when toggling scientific notation.
* Trim trailing zeros in significand in scientific notation.

### v1.4.0-beta (2021-05-10)
* Bumpers machine updates:
	* Add gemstone balls.
	* Reduce costs for some upgrades.
	* Bugfix: Points from bumpers are now multiplied by the Point Multiplier upgrade.
* Adjust physics engine to make it much less likely for a ball to clip through a peg after being slingshotted at high velocity by a bumper.
* Fix bug where balls would teleport a couple pixels away from a bumper immediately after hitting it.

### v1.3.3-beta (2021-05-09)
* Tweak Bumpers machine layout so that the top center target isn't so unreasonably hard to hit.

### v1.3.2-beta (2021-05-09)
* Make bonus wheel pop-up text easier to read.

### v1.3.1-beta (2021-05-09)
* Fix pop-up text not appearing when buying Point Multiplier upgrade.
* Fix score display being momentarily frozen on the old save file's value when importing a save file.

### v1.3.0-beta (2021-05-09)
* **Major new feature: Multiple machines!**
	* This update includes a 2nd machine, but it's incomplete and not balanced yet.
* Fix 8-ball upgrade buttons still having white text when disabled in light mode.

### v1.2.0-beta (2021-05-04)
* Under-the-hood refactor of the game engine in preparation for a planned future update.
* Bugfix: Require buying Better Ball Drops 2 before showing Better Ball Drops 3, and likewise buying 3 before showing 4.

### v1.1.1 (2021-05-03)
* Fix drop zone being drawn 5 pixels too high in April Fools mode.

### v1.1.0 (2021-04-30)
* Add a rotation-based multiplier for beach balls.

### v1.0.1-RC2 (2021-04-26)
* Add a beta version, for testing future updates. Live version save files can be imported into the beta, but beta version saves cannot be imported back into the live version.
* Tweaked a couple pop-up text colors in dark mode to make them easier to read.
* Fixed 2.4x wheel speed being displayed as "2.40x".

### v1.0.0-RC1 (2021-04-11)
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