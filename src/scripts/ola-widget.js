const moment = require('moment');
const restClient = require('./rest-client');

VSS.init({
    explicitNotifyLoaded: true,
    usePlatformScripts: true,
    usePlatformStyles: true
});

VSS.require('TFS/Dashboards/WidgetHelpers', WidgetHelpers => {
    VSS.register('OlaWidget', () => {
        const initialize = widgetSettings => {

            // Retrieve the Account URI and Project Name from the web context (used in links).
            const webContext = VSS.getWebContext();
            const accountUri = webContext.account.uri;
            const projectName = webContext.project.name;

            // Retrieve the stored configuration settings for the widget.
            const settings = JSON.parse(widgetSettings.customSettings.data);

            // Set jQuery selectors for dynamically-populated HTML elements.
            const $title = $('div.title');
            const $queryLink = $('a#query-link');
            const $searchInput = $('input#table-search');
            const $buttons = $('div.counter-container');
            const $percents = $('div.percent');
            const $counts = $('div.count');
            const $allButton = $('div#all-counter');
            const $allPercent = $('div#all-counter > div.percent');
            const $allCount = $('div#all-counter > div.count');
            const $withinButton = $('div#within-counter');
            const $withinPercent = $('div#within-counter > div.percent');
            const $withinCount = $('div#within-counter > div.count');
            const $nearButton = $('div#near-counter');
            const $nearPercent = $('div#near-counter > div.percent');
            const $nearCount = $('div#near-counter > div.count');
            const $pastButton = $('div#past-counter');
            const $pastPercent = $('div#past-counter > div.percent');
            const $pastCount = $('div#past-counter > div.count');
            const $detailTable = $('table#detail-table');
            const $blankTable = $('div#blank-table');

            // Check if the widget has stored configuration settings (i.e., if it has been configured).
            if (settings) {
                // Set the title if present in the configuration settings.
                if (settings.title) {
                    $title.addClass('configured-title');
                    $title.text(settings.title);
                }

                // Set the link to the query if present in the configuration settings.
                if (settings.queryId && settings.queryName) {
                    $queryLink.text('View Query');
                    $queryLink.attr('href', `${accountUri}/${projectName}/_queries/query-edit/${settings.queryId}`);
                    $queryLink.attr('title', settings.queryName);
                }

                // Show or hide the columns if present in the configuration settings and the DataTable has been initialized.
                // If the DataTable has not been initialized, we are loading the full dashboard page.
                // If the DataTable has been initialized, we are reloading the widget due to configuration changes.
                if (settings.columns && $.fn.dataTable.isDataTable($detailTable)) {
                    displaySelectedColumns(settings);
                }

                // Check for all necessary configuration settings before calling the REST Client.
                // This also blocks multiple REST Client calls when changing configuration settings.
                if (settings.queryId
                    && settings.columns
                    && settings.thresholds
                    && (settings.beginWithTriagedDate || settings.beginWithCreatedDate)
                    && (settings.endWithResolvedDate || settings.endWithClosedDate)) {

                    // Remove the "blank" display for the table area.
                    $blankTable.toggle(false);

                    // Use the REST Client to retrieve and process the work item data.
                    restClient.processQuery(settings).then(resultSummary => {
                        // Check for the error flag and handle if present. Construct the DataTable otherwise.
                        resultSummary.error ? displayErrorMessage() : populateDetailTable(resultSummary, settings);
                    }).catch(error => error);
                }
            } else {
                // Set a default "blank" display for the widget.
                $title.text('Please configure the widget...');
                $percents.text('-- %');
                $counts.text('( -- )');
                $blankTable.toggle(true);
                $blankTable.append('<span style=fon')
                $blankTable.append('<span style="font-style: italic; color: gray">To configure the widget, click the <img style="vertical-align: middle" src="../images/Configure-Button-Small.png"> <span style="font-style: normal; color: black; font-size: 15px; font-weight: 550">Configure</span> button in the top right corner of the widget.</span>');
            }

            function displayErrorMessage() {
                $title.addClass('error-title');
                $title.text('\u26A0 ERROR');
                $percents.text('-- %');
                $counts.text('( -- )');
                $queryLink.toggle(false);
                $blankTable.toggle(true);
                $blankTable.append('You do not have permission to view the selected query, or the query no longer exists. ');
                $blankTable.append('Please select a new query for which you have viewing permissions.<br/><br/>');
                $blankTable.append('If you are unable to edit the widget, contact a Dashboard Administrator.');
            }

            function displaySelectedColumns(settings) {
                const dataTable = $detailTable.DataTable();

                // Retrieve each column from the data table.
                const stateColumn = dataTable.column('state:name');
                const severityColumn = dataTable.column('severity:name');
                const triageColumn = dataTable.column('triage:name');
                const assigneeColumn = dataTable.column('assignee:name');
                const createdDateColumn = dataTable.column('created-date:name');
                const triagedDateColumn = dataTable.column('triaged-date:name');
                const nearOlaDateColumn = dataTable.column('near-ola-date:name');
                const pastOlaDateColumn = dataTable.column('past-ola-date:name');
                const resolvedDateColumn = dataTable.column('resolved-date:name');
                const closedDateColumn = dataTable.column('closed-date:name');
                const elapsedBusinessDaysColumn = dataTable.column('elapsed-business-days:name');

                // Show or hide each column per configuration settings.
                stateColumn.visible(settings.columns.state);
                severityColumn.visible(settings.columns.severity);
                triageColumn.visible(settings.columns.triage);
                assigneeColumn.visible(settings.columns.assignee);
                createdDateColumn.visible(settings.columns.createdDate);
                triagedDateColumn.visible(settings.columns.triagedDate);
                nearOlaDateColumn.visible(settings.columns.nearOlaDate);
                pastOlaDateColumn.visible(settings.columns.pastOlaDate);
                resolvedDateColumn.visible(settings.columns.resolvedDate);
                closedDateColumn.visible(settings.columns.closedDate);
                elapsedBusinessDaysColumn.visible(settings.columns.elapsedBusinessDays);
            }

            function populateDetailTable(resultSummary, settings) {
                const allCount = resultSummary.allCount;
                const withinCount = resultSummary.withinCount;
                const nearCount = resultSummary.nearCount;
                const pastCount = resultSummary.pastCount;

                // Set the summary button percents and counts per the processed query results.
                if (allCount === 0) {
                    $percents.text('0%');
                    $counts.text('( 0 )');
                } else {
                    $allPercent.text(Math.round(allCount / allCount * 100) + '%');
                    $withinPercent.text(Math.round(withinCount / allCount * 100) + '%');
                    $nearPercent.text(Math.round(nearCount / allCount * 100) + '%');
                    $pastPercent.text(Math.round(pastCount / allCount * 100) + '%');
                    $allCount.text(`( ${allCount} )`);
                    $withinCount.text(`( ${withinCount} )`);
                    $nearCount.text(`( ${nearCount} )`);
                    $pastCount.text(`( ${pastCount} )`);
                }

                // Check if the DataTable has been initialized.
                // If it has not been initialized, we are loading the full dashboard page.
                // If it has been initialized, we are reloading the widget due to configuration changes.
                if ($.fn.dataTable.isDataTable($detailTable)) {
                    const dataTable = $detailTable.DataTable();

                    // Reload the DataTable with the new results.
                    dataTable.clear();
                    dataTable.rows.add(resultSummary.data);

                    // Show or hide the columns.
                    displaySelectedColumns(settings);
                } else {
                    // Initialize the DataTable.
                    initializeDataTable(resultSummary.data, settings);
                }

                // Remove the default search bar.
                $('#detail-table_filter').toggle(false);

                // Adjust the DataTable columns and draw the table.
                const dataTable = $detailTable.DataTable();
                dataTable.columns.adjust().draw();

                // Enable DataTable filtering from the custom search bar.
                $searchInput.on('input', function () {
                    $buttons.removeClass('selected');
                    dataTable.search($(this).val()).draw();
                });

                // Enable shortcut filtering from the summary buttons.
                // Clicking "All Bugs" clears the search filter.
                // Clicking the other three buttons filters by the appropriate OLA Status term.
                function searchButtonHandler() {
                    if ($(this).attr('id') === 'all-counter') {
                        $searchInput.val('');
                    } else {
                        let searchValue = $(this).attr('id').split('-')[0];
                        let capitalizedSearchValue = searchValue.substring(0, 1).toUpperCase() + searchValue.substring(1, searchValue.length);
                        $searchInput.val(capitalizedSearchValue);
                    }
                    $searchInput.trigger('input');
                    $buttons.removeClass('selected');
                    $(this).addClass('selected');
                }

                $allButton.click(searchButtonHandler);
                $withinButton.click(searchButtonHandler);
                $nearButton.click(searchButtonHandler);
                $pastButton.click(searchButtonHandler);

                // Enable row selection and highlighting.
                $('tr').click(function () {
                    $(this).hasClass('selected') ? $(this).removeClass('selected') : $(this).addClass('selected');
                });
            }

            function initializeDataTable(data, settings) {
                $detailTable.DataTable({
                    info: false,
                    paging: false,
                    scrollY: '175px',
                    data: data,
                    columns: [
                        {
                            title: '<span title="Work Item ID">ID</span>',
                            data: 'id',
                            render: (data, type, row, meta) => renderIdCell(data, type, row)
                        },
                        {
                            title: '<span title ="OLA Status">Status</span>',
                            data: 'olaStatus',
                            render: (data, type, row, meta) => renderStatusCell(data, type)
                        },
                        {
                            title: '<span title="State">State</span>',
                            name: 'state',
                            data: 'state',
                            visible: settings.columns.state,
                            searchable: settings.columns.state,
                            render: (data, type, row, meta) => renderStateCell(data, type)
                        },
                        {
                            title: '<span title="Severity">Severity</span>',
                            name: 'severity',
                            data: 'severity',
                            visible: settings.columns.severity,
                            searchable: settings.columns.severity,
                            render: (data, type, row, meta) => renderSeverityCell(data, type)
                        },
                        {
                            title: '<span title="Triage Value">Triage</span>',
                            name: 'triage',
                            data: 'triage',
                            visible: settings.columns.triage,
                            searchable: settings.columns.triage,
                            render: (data, type, row, meta) => data ? data : '-'
                        },
                        {
                            title: '<span title="Assignee">Assignee</span>',
                            name: 'assignee',
                            data: 'assignedTo',
                            visible: settings.columns.assignee,
                            searchable: settings.columns.assignee,
                            render: (data, type, row, meta) => renderAssigneeCell(data, type)
                        },
                        {
                            title: '<span title="Created Date">Created</span>',
                            name: 'created-date',
                            data: 'dates.createdDate',
                            visible: settings.columns.createdDate,
                            searchable: settings.columns.createdDate,
                            render: (data, type, row, meta) => renderGeneralDateCell(data, type)
                        },
                        {
                            title: '<span title="Triaged Date">Triaged</span>',
                            name: 'triaged-date',
                            data: 'dates.triagedDate',
                            visible: settings.columns.triagedDate,
                            searchable: settings.columns.triagedDate,
                            render: (data, type, row, meta) => renderGeneralDateCell(data, type)
                        },
                        {
                            title: '<span title="Near OLA Date">Near</span>',
                            name: 'near-ola-date',
                            data: 'dates.nearOlaDate',
                            visible: settings.columns.nearOlaDate,
                            searchable: settings.columns.nearOlaDate,
                            render: (data, type, row, meta) => renderGeneralDateCell(data, type)
                        },
                        {
                            title: '<span title="Past OLA Date">Past</span>',
                            name: 'past-ola-date',
                            data: 'dates.pastOlaDate',
                            visible: settings.columns.pastOlaDate,
                            searchable: settings.columns.pastOlaDate,
                            render: (data, type, row, meta) => renderGeneralDateCell(data, type)
                        },
                        {
                            title: '<span title="Resolved Date and Reason">Resolved</span>',
                            name: 'resolved-date',
                            data: 'dates.resolvedDate',
                            visible: settings.columns.resolvedDate,
                            searchable: settings.columns.resolvedDate,
                            render: (data, type, row, meta) => renderResolvedDateCell(data, type, row)
                        },
                        {
                            title: '<span title="Closed Date">Closed</span>',
                            name: 'closed-date',
                            data: 'dates.closedDate',
                            visible: settings.columns.closedDate,
                            searchable: settings.columns.closedDate,
                            render: (data, type, row, meta) => renderGeneralDateCell(data, type)
                        },
                        {
                            title: '<span title="Elapsed Business Days (Start to End)">EBD</span>',
                            name: 'elapsed-business-days',
                            data: 'elapsedBusinessDays',
                            visible: settings.columns.elapsedBusinessDays,
                            searchable: settings.columns.elapsedBusinessDays,
                            render: (data, type, row, meta) => data === null ? '-' : data
                        }
                    ],
                    rowCallback: (row, data, displayNum, displayIndex, dataIndex) => {

                        // Colorize the "OLA Status" cell based on its value.
                        let $olaStatusCell = $('div.status-cell', row).parent('td');
                        $olaStatusCell.attr('id', data.olaStatus.toLowerCase());

                        // Left-align the "State" cell.
                        let $stateCell = $('span.state-dot', row).parent('td');
                        $stateCell.addClass('left-align-cell');
                    }
                });
            }

            // Wrap the ID in a link so that hovering gives the title and clicking opens the work item in VSTS.
            function renderIdCell(data, type, row) {
                if (type === 'display') {
                    let $idCellContent = $('<a></a>');
                    $idCellContent.text(data);
                    $idCellContent.attr('title', row.title);
                    $idCellContent.attr('target', '_blank');
                    $idCellContent.attr('href', `${accountUri}/${projectName}/_workitems/edit/${data}`);
                    return $idCellContent.prop('outerHTML');
                } else {
                    return data;
                }
            }

            // Tag the OLA Status cell to colorize in the rowCallback.
            function renderStatusCell(data, type) {
                if (type === 'display') {
                    let $statusCellContent = $('<div></div>');
                    $statusCellContent.text(data);
                    $statusCellContent.addClass('status-cell');
                    return $statusCellContent.prop('outerHTML');
                } else {
                    return data;
                }
            }

            // Tag the State cell to left-align in the rowCallback, and add the state dot.
            function renderStateCell(data, type) {
                if (type === 'display') {
                    let $stateCellContent = $('<span></span>');
                    $stateCellContent.addClass('state-dot');
                    $stateCellContent.attr('id', data.toLowerCase() + '-dot');
                    return $stateCellContent.prop('outerHTML') + data;
                } else {
                    return data;
                }
            }

            // Abbreviate the Severity cell.
            function renderSeverityCell(data, type) {
                if (type === 'display' || type == 'filter' || type == 'sort') {
                    let abbreviatedData = data;
                    if (data === '1 - Critical') { abbreviatedData = '1-Crit'; }
                    else if (data === '2 - High') { abbreviatedData = '2-High'; }
                    else if (data === '3 - Medium') { abbreviatedData = '3-Med'; }
                    else if (data === '4 - Low') { abbreviatedData = '4-Low'; }
                    return abbreviatedData;
                } else {
                    return data;
                }
            }

            // Format the Assignee cell by "Last Name, First Name", handling edge cases.
            function renderAssigneeCell(data, type) {
                if (type === 'display' || type === 'filter' || type === 'sort') {
                    if (data) {
                        // Strip out email addresses and extraneous Do Not Mail flags and dates and
                        // remove leading and trailing spaces. Split <first name> <middle name> <last name>.
                        let strippedData = data.replace(/<.*?>/, '').replace('Do Not Mail', '').replace(/\d{2}-\d{2}-\d{4}/, '').trim();
                        let splitName = strippedData.split(' ');

                        // Check for middle name and format appropriately.
                        if (splitName.length === 2) {
                            return splitName[1] + ', ' + splitName[0];
                        } else if (splitName.length === 3) {
                            return splitName[2] + ', ' + splitName[0];
                        } else {
                            return data;
                        }
                    } else {
                        return '-';
                    }
                } else {
                    return data;
                }
            }

            // Format the dates used in the Created, Triaged, Near, Past, and Closed columns.
            // Ensure that the dates are sorted properly using a separate format.
            function renderGeneralDateCell(data, type) {
                if (data) {
                    if (type === 'display' || type === 'filter') {
                        return moment.utc(data).format('M/D/YYYY');
                    } else {
                        return moment.utc(data).format('YYYY-MM-DD:HH:mm:ss.SSS');
                    }
                } else {
                    return '-';
                }
            }

            // Format the dates used in the Resolved column.
            // Ensure that the dates are sorted properly using a separate format.
            // Wrap the Resolved Date so that hovering gives the Resolved Reason.
            function renderResolvedDateCell(data, type, row) {
                if (data) {
                    if (type === 'display' || type === 'filter') {
                        let $resolvedDateCellContent = $('<div></div>');
                        $resolvedDateCellContent.text(moment.utc(data).format('M/D/YYYY'));
                        $resolvedDateCellContent.attr('title', row.resolvedReason);
                        $resolvedDateCellContent.addClass('resolved-date-cell');
                        return $resolvedDateCellContent.prop('outerHTML');
                    } else {
                        return moment.utc(data).format('YYYY-MM-DD:HH:mm:ss.SSS');
                    }
                } else {
                    return '-';
                }
            }
            return WidgetHelpers.WidgetStatusHelper.Success();
        };

        return {
            load: widgetSettings => {
                return initialize(widgetSettings);
            },
            reload: widgetSettings => {
                return initialize(widgetSettings);
            }
        };
    });
    VSS.notifyLoadSucceeded();
});