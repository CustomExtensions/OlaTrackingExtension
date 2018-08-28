# OLA Tracking Widget

### ![Github Logo][github-logo] [&nbsp;GitHub](https://github.com/CustomExtensions/OlaTrackingExtension)

### ![VSTS Logo][vsts-logo] [&nbsp;VSTS Marketplace](https://marketplace.visualstudio.com/items?itemName=tmdement.olaTrackingWidget)

A widget for tracking the Operating Level Agreement (OLA) for support bugs.

| Table of Contents |
| :--- |
| [Summary](#summary) |
| [Preconditions](#preconditions) |
| [Setup](#setup) |
| [How to Use](#how-to-use) |
| [Sample Queries](#sample-queries) |

<a name="summary"></a>

## Summary

The purpose of this widget is to provide a streamlined and configurable method for tracking the OLA for support bugs at a glance. The widget's functionality is based on the query system of Visual Studio Team Services (VSTS), and uses the [VSS SDK](https://docs.microsoft.com/en-us/vsts/extend/reference/client/core-sdk?view=vsts) and [REST Clients](https://docs.microsoft.com/en-us/vsts/extend/reference/client/rest-clients?view=vsts) for authentication and to retrieve work item data.

The widget processes dates and times using the [Moment](https://momentjs.com/) package and its [Business](https://momentjs.com/docs/#/plugins/moment-business/) plugin. The widget then processes the query data and displays the results using the [DataTables](https://datatables.net/) jQuery plugin.

<a name="preconditions"></a>

## Preconditions

#### Minimum Requirements for Queries

Before using the widget, the user must first define a query that produces the desired subset of bugs the widget will process and display. The widget makes certain assumptions about the work items produced by this query, namely that the result set will only contain work items whose `Work Item Type` is `Bug`, so therefore any query written for use in this widget should include a clause selecting bugs:

| And/Or | Field | Operator | Value |
| :--- | :--- | :--- | :--- |
| - | `Work Item Type` | `=` | `Bug` |

The widget also assumes that bugs have a `Severity` field, which is present by default in VSTS. The widget currently supports the following values for `Severity`:

- `1 - Critical`
- `2 - High`
- `3 - Medium`
- `4 - Low`

There is no need to check for these values at the query level, unless filtering for a specific severity level is desired.

Please see the [**Sample Queries**](#sample-queries) section for more information.

#### Query Location

Queries can be saved to either **My Queries** or **Shared Queries** in VSTS, and the widget will behave differently depending upon the location of the query.

If the user selects a query from **My Queries** in the widget settings, they alone can to view the query results in the widget. All other users will see the following when viewing the given dashboard:

![Error Widget][error-widget]

If the user selects a query from **Shared Queries** in the widget settings, anyone with permission to view the given dashboard can view the query results in the widget:

![Configured Widget][configured-widget]

#### Dates and Times

The widget standardizes all retrieved dates and times to use `UTC`, and the dates it displays after processing the data are given in `UTC` as well.

<a name="setup"></a>

## Setup

Once the user has created a query, the next step is to add one or more widgets to a dashboard.

After the extension has been installed, click the `Edit` button at the top of the VSTS dashboard. Find the **OLA Tracking Widget** from available widgets, and either drag and drop it onto the dashboard, or select it and click `Add`.

The widget will initially appear blank, and will need to be configured:

![Unconfigured Widget][unconfigured-widget]

To configure the widget, click `Configure` button in the top right corner of the widget.

The configuration options are as follows:

#### Query

![Configure Query][config-query]

The query used as primary input for the widget.

As mentioned in the [**Preconditions**](#preconditions) section, the query should only return work items that are `Bugs`, and the location of the query in either **My Queries** or **Shared Queries** will affect the behavior of the widget.

#### Title

![Configure Title][config-title]

The title of the widget.

When a query is selected, the title of the query is automatically copied to the widget title field. However, the title can be independently changed.

#### Columns

![Configure Columns][config-columns]

The columns that will appear in the detail table of the widget.

By default, all of the following columns are selected and will appear:

- `State`
- `Severity`
- `Triage Value`
- `Assignee`
- `Created Date`
- `Triaged Date`
- `Near OLA Date`
- `Past OLA Date`
- `Resolved Date`
- `Closed Date`
- `Elapsed Business Days`

To hide any of these columns, deselect them from the drop-down menu and save the widget configuration.

For a more detailed description of these columns, please see the [**How to Use**](#how-to-use) section.

#### Begin OLA tracking when ...

![Configure Begin OLA][config-begin]

Specifies when the OLA tracking should begin.

The first option causes the widget to begin tracking when the bug is created.

The second option causes the widget to begin tracking when the `Triage` field of a bug is first set to `Triaged`. If this option is selected and a particular bug has never been triaged, the date and time it was created will be used instead.

#### End OLA tracking when ...

![Configure End OLA][config-end]

Specifies when the OLA tracking should end.

The first option causes the widget to end tracking when the `State` field of a bug is last set to `Closed`.

The second option causes the widget to end tracking when the `State` field of a bug is last set to `Resolved`.

In either case, if a bug is not `Closed` or `Resolved` (respectively), the current date and time will be used to determine its OLA status.

#### Bugs are near the OLA deadline after ...

![Configure Near OLA][config-near]

Specifies when bugs should be considered `Near` their OLA deadline.

For each severity level, selecting the `Hours` option will perform a strict addition to the OLA start date (either `Triaged Date` or `Created Date`) by the number of hours specified.

For each severity level, selecting the `Business Days` option will add the specified number of discrete business days (Monday through Friday, excluding weekends) to the OLA start date and pad the deadline out to the end of the resulting day (i.e., `23:59:59.999 UTC`).

Note that if the `Closed` option is chosen for ending OLA tracking, bugs that have been `Closed` will only appear as either `Within` or `Past` their OLA deadline.

Likewise, if the `Resolved` option is chosen for ending OLA tracking, bugs that have been `Resolved` will only appear as either `Within` or `Past` their OLA deadline.

In other words, only open bugs are ever considered `Near` their OLA deadline.

#### Bugs are past the OLA deadline after ...

![Configure Past OLA][config-past]

Specifies when bugs should be considered `Past` their OLA deadline.

The `Hours` and `Business Days` options perform in the same manner as described above.

<a name="how-to-use"></a>

#### Live Preview

In order to prevent excessive calls from the REST Client, the live preview of the widget will only update when the **Title** or **Columns** options are changed. All other options require the widget to be saved before the new results are visible.

## How to Use

Once the configuration options are properly set and saved, the widget will be populated with data as follows:

![Configured Widget][configured-widget]

#### Features

The `View Query` link under the widget title opens to the query editor for the selected query in VSTS.

The `All Bugs`, `Within OLA`, `Near OLA`, and `Past OLA` summary buttons at the top of the widget give a count and percentage for each of the respective categories. Note that bugs that are `Near` their OLA deadline also contribute to the `Within OLA` count and percentage. Note also that only open bugs contribute to the `Near` count and percentage as described in the [**Setup**](#setup) section.

Clicking the summary buttons will filter the detail table so that it only shows bugs for the selected category. Note that clicking the `Within OLA` summary button will not display bugs that are `Near` their OLA deadline, only those that are `Within` but not `Near`.

The `Search` field filters the detail table so that it only displays rows containing data matching the entered text. Any data that is visible in the detail table can be used to filter the rows via the `Search` field.

Hovering over a column header will display its full title, and clicking on a column header will sort the detail table by the values displayed in that column.

Rows can be highlighted for emphasis by clicking on them.

#### Column Descriptions

Below is a short description of each of the available columns and their additional features:

| Column Title | Full Title | Description |
| --- | --- | --- |
| `ID` | Work Item ID | The work item ID for the bug. Hovering over the ID will display the bug's title, and clicking on the ID opens the bug in VSTS. |
| `Status` | OLA Status | The OLA status of the bug, either `Within`, `Near`, or `Past`. Note that only non-resolved or non-closed bugs can be considered `Near` their OLA deadline. |
| `State` | State | The state of the bug, typically either `New`, `Active`, `Resolved`, or `Closed`. |
| `Severity` | Severity | The severity of the bug, typically either `1 - Critical`, `2 - High`, `3 - Medium`, or `4 - Low` (display values are abbreviated). |
| `Triage` | Triage Value | The value of the `Triage` field of the bug, typically either `Info Received`, `More Info`, `Pending`, or `Triaged`. |
| `Assignee` | Assignee | The person to which the bug is currently assigned. |
| `Created` | Created Date | The date the bug was created, in the `YYYY-MM-DD (UTC)` format. |
| `Triaged` | Triaged Date | The date the bug was first triaged, in the `YYYY-MM-DD (UTC)` format. |
| `Near` | Near OLA Date | The date after which the bug is considered near its OLA deadline, in the `YYYY-MM-DD (UTC)` format. |
| `Past` | Past OLA Date | The date after which the bug is considered past its OLA deadline, in the `YYYY-MM-DD (UTC)` format. |
| `Resolved` | Resolved Date | The date the bug was last resolved, in the `YYYY-MM-DD (UTC)` format. |
| `Closed` | Closed Date | The date the bug was last closed, in the `YYYY-MM-DD (UTC)` format. |
| `EBD` | Elapsed Business Days (Start to End) | The number of business days between when the bug's OLA tracking began (depending on the option chosen to begin OLA tracking) and the current time and date. This value will only appear for non-resolved or non-closed bugs (depending on the option chosen to end OLA tracking). |

<a name="sample-queries"></a>

## Sample Queries

The following are some example queries that can be used in conjunction with the OLA Tracking Widget.

#### Tracking All Open Bugs

In the example below, bugs are categorized by their `Iteration Path`, and support bugs are identified by their `Source` field having the value `External`.

| And/Or | Field | Operator | Value |
| :--- | :--- | :--- | :--- |
| - | `Work Item Type` | `=` | `Bug` |
| `And` | `Iteration Path` | `Under` | *Path to project, team, sprint, etc* |
| `And` | `Source` | `=` | `External` |
| `And` | `State` | `<>` | `Closed` |

In the example below, bugs are categorized by their `Area Path`, and support bugs are identified by their `Tags` field containing the value `Support`.

| And/Or | Field | Operator | Value |
| :--- | :--- | :--- | :--- |
| - | `Work Item Type` | `=` | `Bug` |
| `And` | `Area Path` | `Under` | *Path to project, team, sprint, etc* |
| `And` | `Tags` | `Contains` | `Support` |
| `And` | `State` | `<>` | `Closed` |

#### Tracking Bugs Within a Date Range

In the example below, we are modifying the first query to return all bugs that were created within a given month.

| And/Or | Field | Operator | Value |
| :--- | :--- | :--- | :--- |
| - | `Work Item Type` | `=` | `Bug` |
| `And` | `Iteration Path` | `Under` | *Path to project, team, sprint, etc* |
| `And` | `Source` | `=` | `External` | 
| `And` | `Created Date` | `>= ` | `1/1/2018` |
| `And` | `Created Date` | `<=` | `1/31/2018` |

#### Tracking Fixed Bugs

In the example below, we are modifying the first query to return all bugs except those that do not have a `Resolved Reason` containing `Fixed`. This effectively returns bugs that were resolved due to being `Fixed` or `Fixed and Verified`, but filters out bugs that were resolved for any of the following reasons:

- `As Designed`
- `Cannot Reproduce`
- `Copied to Backlog`
- `Deferred`
- `Duplicate`
- `Obsolete`
- `Will Not Address`

Note the grouping of the final two clauses.

| And/Or | Field | Operator | Value |
| :--- | :--- | :--- | :--- |
| - | `Work Item Type` | `=` | `Bug` |
| `And` | `Iteration Path` | `Under` | *Path to project, team, sprint, etc* |
| `And` | `Source` | `=` | `External` |
| &#8968;&nbsp;&nbsp;&nbsp; `And` | `State` | `<>` | `Closed` |
| &#8970;&nbsp;&nbsp;&nbsp; `Or` | `Resolved Reason` | `Contains` | `Fixed` |

#### Further Specification

Specification at this level is limited only by the capability of the query system.

For more information on how to construct queries, please see the [Visual Studio Team Services Documentation](https://docs.microsoft.com/en-us/vsts/work/track).

[github-logo]: src/images/GitHub-Logo-Small.png "GitHub Logo"
[vsts-logo]: src/images/VSTS-Logo-Small.png "VSTS Logo"

[unconfigured-widget]: src/images/Unconfigured-Widget.png "Unconfigured Widget"
[error-widget]: src/images/Error-Widget.png "Error Widget"
[configured-widget]: src/images/Configured-Widget.png "Configured Widget"

[config-query]: src/images/Config-Query.png "Configure Query"
[config-title]: src/images/Config-Title.png "Configure Title"
[config-columns]: src/images/Config-Columns.png "Configure Columns"
[config-begin]: src/images/Config-Begin.png "Configure Begin OLA"
[config-end]: src/images/Config-End.png "Configure End OLA"
[config-near]: src/images/Config-Near.png "Configure Near OLA"
[config-past]: src/images/Config-Past.png "Configure Past OLA"
