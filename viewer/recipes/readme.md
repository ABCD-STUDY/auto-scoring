# Directory for recipes

Recipes contain the algorithm that convert values in REDCap to other values in REDCap.

Some general workflows have been established to support the data curation using recipes.

### Re-code items

An item in REDCap that represents a list of checkboxes or radio button uses a specific coding for each of the available choices. There are several reason why one might want to change the coding with data already captured. Sometimes the published algorithm specifies a coding and users of the data would assume the published coding. Changing the coding used in REDCap will therefore improve the usability of the data for end-users. Sometimes the initial list of choices was not sufficient. For example an entry for don't know might have been overlooked. Adding this new option might change previous data.

The challenge of re-coding variables in a production system with ongoing data collection requires a three-step approach.

 - create new variables with correct coding, add @HIDDEN to existing items
 - create an auto-scoring recipe that transforms from the old to the new coding and run it once
 - delete the old items

We first create a new set of items in REDCap that fix the problem and that have unique item names but the same item descriptions. Once they have been added the previously used items are switched off by hiding them. This step will allow for a data collection using the new variables. Old records will show temporarily no values. Auto-scoring is now used to copy the old values under the correct value transformation into the new values. After this step is done the old values can be deleted from the data collection instruments.

