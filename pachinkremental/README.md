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
* Auto-drop doesn't work correctly while the game is running in the background.

## Changelog

### v0.1 beta (2021-03-24)
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