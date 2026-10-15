# Travel Shopping List

A personal tool for organizing items the user wants to buy or eat while traveling, grouped by destination.

## Language

**Destination**:
A place the user is traveling to, freely named with no enforced hierarchy (e.g., "Korea" and "Seoul" can both exist as sibling Destinations).
_Avoid_: Trip, Country, City

**List**:
One of the two fixed groupings under a Destination — "Want to Buy" or "Want to Eat" — used to organize Stores. A third List ("Want to Visit") is planned but not yet built.
_Avoid_: Category, Tab, 大分類

**Store**:
A shop, brand, or vendor the user wants to visit (e.g., "Starbucks", "Olive Young"), belonging to exactly one List ("Want to Buy" or "Want to Eat") that never changes. A Store is created once and reused across Destinations by picking it from an existing list, rather than re-entered each time.
_Avoid_: Shop, Brand, Big Item, 大項目

**Item**:
A specific product (e.g., "Hojicha Milk", "Sheet Mask") the user wants to buy or eat, with a name, optional photo, optional description, and a completed/purchased checkbox. Items and their completed status belong to one Destination's use of a Store — even when the same Store is shared across multiple Destinations, each Destination keeps its own separate set of Items.
_Avoid_: Product, Small Item, 小項目
