# Deriving Hooks - An Experiment

This project is a collection of code, unfolding step by step through the commits marked as branches with names like "start-here" and "checkpoint-7", etc. The intent is to walk through the changes to the code in order, from the start.

The goal is to motivate designs behind typical framework features like components (and mounting), local state (ie, hooks), and more. We walk step by step from a single function up to a simple (but useful) POC "framework". Along the way, we make decisions about a way to accomplish a task, then analyze the pros/cons of that decision, and in various cases change directions and design a different solution.

Each checkpoint is a single commit, which should make it easier to compare a diff from a checkpoint to its predecessor, to get a sense of what changed. You won't necessarily get much out of this project by simply looking at the end result; the point is the journey through these evolutions.

One of the most important fundamental skills we solidify and expound on throughout this project is closure. If you don't feel fully confident in that topic, I invite you to also read my book, [*You Don't Know JS Yet: Scope & Closures (2nd-ed)*](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/README.md#you-dont-know-js-yet-scope--closures---2nd-edition) for a deep dive. Consider this project an interesting exploration of what can be accomplished once you *get* closure.

## License

All code and documentation are (c) 2020 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/).
