# How to pull results from Promptfoo

This document explains how to pull results from Promptfoo, in the form of CSVs for overviews, and JSON for specific run results. 

## Prereqs
- Promptfoo installed and configured
- A test run has been executed

## Getting Results using the UI

### Start the UI Server
To get results using the UI, use the following command:

```bash
npm run view # this launches a promptfoo server on port 15500
```

This will open the Promptfoo UI in your browser, where you can view and export results.

### Get to the All Runs Search Page
After starting the UI server, you may land on a url like: `http://localhost:15500/eval`

If so, find the "Evals" link in the breadcrumbs above the results table, and click the link.

Alternatively you client the "View Results" navigation menu which will open a dropdown with the "All Runs" option. Use the All Runs option to navigate to the search page.

Finally you access the search page via: `http://localhost:15500/` if your configurations match the default.

### Download All Runs CSV

Just above the table you should see some buttons. One says "Export" with a download arrow. 

Click this button, and it will pop open a menu with the option to Export CSV. 

Save this CSV to your preferred location. It contains the results of all runs.

Filter this CSV down to just the Evaluation Suite you want to document in Excel or an equivalent tool.

### Downloading a Specific Run's Results

If you want to pull the results from a specific run, find that run in the table. 

You can use the filter or search bar to find the run you're looking for.

Click on the run's Id to open its details page. 

On the Run Details page, 
find the "Evals actions" button/dropdown in the upper right. Click on it to expand the dropdown, where you will find "Download". 

This will open a dialog box with several options including "Download Results JSON". 

Save the resulting JSON file to your preferred location. Be advised that the file name will be the eval ID, rather than the Suite Description.

## Getting Results using the CLI

### For This Specific Run
To save the results from the run you are about to execute, use the following command:

```bash
npx promptfoo eval --output <output-file> --config <config-file>
```

This will save the results to the specified output file in JSON format.

### For the most recent run
To get the results from the most recent run, use the following command:

```bash
npx promptfoo export eval latest --output <output-file>
```

This will export the results of the most recent run to the specified output file in JSON format.

### For a Specific Run ID
To get a list of Run IDs, use the following command:

```bash
npx promptfoo list evals
```

Find the run ID you want to export in the list.

To get the results from a specific run ID, use the following command:

```bash
npx promptfoo export eval <run-id> --output <output-file>
```

This will export the results of the specified run to the specified output file in JSON format.
