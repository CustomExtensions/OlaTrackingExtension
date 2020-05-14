const _ = require('lodash');

VSS.init({
    explicitNotifyLoaded: true,
    usePlatformScripts: true,
    usePlatformStyles: true
});

VSS.require(['TFS/Dashboards/WidgetHelpers', 'TFS/WorkItemTracking/RestClient'], (WidgetHelpers, RestClient) => {
    WidgetHelpers.IncludeWidgetConfigurationStyles();

    VSS.register('OlaWidget.Configuration', () => {

        // const maximumQuerySize = 10;

        // Set jQuery selectors for dynamically-populated HTML elements.
        let $titleInput = $('#title-input');
        let $querySelectInput = $('#query-select-input');
        let $querySelectPopup = $('#query-select-popup');
        let $nonBugQueryError = $('#non-bug-query-error');
        let $largeQueryError = $('#large-query-error');
        let $columnSelectInput = $('#column-select-input');
        let $columnSelectPopup = $('#column-select-popup');
        let $beginWithTriagedDateRadio = $('#begin-with-triaged-date-radio');
        let $beginWithCreatedDateRadio = $('#begin-with-created-date-radio');
        let $endWithResolvedDateRadio = $('#end-with-resolved-date-radio');
        let $endWithClosedDateRadio = $('#end-with-closed-date-radio');
        let $stateCheckbox = $('#state-checkbox');
        let $severityCheckbox = $('#severity-checkbox');
        let $triageCheckbox = $('#triage-checkbox');
        let $assigneeCheckbox = $('#assignee-checkbox');
        let $createdDateCheckbox = $('#created-date-checkbox');
        let $triagedDateCheckbox = $('#triaged-date-checkbox');
        let $nearOlaDateCheckbox = $('#near-date-checkbox');
        let $pastOlaDateCheckbox = $('#past-date-checkbox');
        let $resolvedDateCheckbox = $('#resolved-date-checkbox');
        let $closedDateCheckbox = $('#closed-date-checkbox');
        let $elapsedBusinessDaysCheckbox = $('#elapsed-business-days-checkbox');
        let $nearCritNumber = $('#near-crit-number');
        let $nearCritSelect = $('#near-crit-select');
        let $nearHighNumber = $('#near-high-number');
        let $nearHighSelect = $('#near-high-select');
        let $nearMedNumber = $('#near-med-number');
        let $nearMedSelect = $('#near-med-select');
        let $nearLowNumber = $('#near-low-number');
        let $nearLowSelect = $('#near-low-select');
        let $pastCritNumber = $('#past-crit-number');
        let $pastCritSelect = $('#past-crit-select');
        let $pastHighNumber = $('#past-high-number');
        let $pastHighSelect = $('#past-high-select');
        let $pastMedNumber = $('#past-med-number');
        let $pastMedSelect = $('#past-med-select');
        let $pastLowNumber = $('#past-low-number');
        let $pastLowSelect = $('#past-low-select');

        return {
            load: (widgetSettings, widgetConfigurationContext) => {

                // Retrieve the project name from the web context and use the REST Client
                // to retrieve the queries or folders at the project root.
                const projectName = VSS.getWebContext().project.name;
                return RestClient.getClient().getQueries(projectName, 'Minimal', 1).then(result => {
                    // Group the root queries or folders and create the base of the query drop-down.
                    const baseQuery = {};
                    baseQuery.hasChildren = true;
                    baseQuery.children = result;
                    createUnorderedList(baseQuery, $querySelectPopup);

                    // Creates an unordered list, each item of which is a child of the base query given.
                    // The list is inserted into the parent element specified in the parameters.
                    function createUnorderedList(query, $parentElement) {
                        if (query.hasChildren) {
                            $parentElement.append('<ul></ul>');
                            const $childList = $parentElement.children('ul');

                            // Sort the list first by folder/query, then alphabetically.
                            const sortedChildren = _.sortBy(query.children, ['isFolder', 'name']);

                            // For each child of the base query, create the list item,
                            // setting the appropriate class (folder or query) and adding
                            // the appropriate change handler (folder or query).
                            // The Work Item ID is used as the ID for the list item HTML element,
                            // and is later used to make REST Client calls.
                            sortedChildren.forEach(child => {
                                if (child.isFolder) {
                                    $childList.append(`<li id="${child.id}" class="folder"><a title="${child.name}">${child.name}</a></li>`);
                                    $(`#${child.id} > a`).click(child.id, folderHandler);
                                } else {
                                    $childList.append(`<li id="${child.id}" class="query"><a title="${child.name}">${child.name}</a></li>`);
                                    $(`#${child.id} > a`).click(child.id, queryHandler);
                                }
                            });
                        }
                    }

                    // Handle clicks for folder items.
                    // The handler is attached to the inner <a></a> element instead of the <li></li>
                    // element to avoid cascading the event to the more deeply-nested lists.
                    function folderHandler(event) {
                        if ($(`#${event.data}`).hasClass('fetched')) {
                            // If we have already retrieved the data when clicked, simply expand or collapse the node.
                            $(`#${event.data}`).hasClass('expanded') ? $(`#${event.data}`).removeClass('expanded') : $(`#${event.data}`).addClass('expanded');
                        } else {
                            // If we have not yet retrieved the data when clicked, retrieve the data,
                            // create a new list from the data and attach it to the node, expand the node,
                            // and flag the node as "fetched". 
                            $(`#${event.data}`).addClass('fetched');
                            RestClient.getClient().getQuery(projectName, $(`#${event.data}`).attr('id'), 'Minimal', 1).then(result => {
                                createUnorderedList(result, $(`#${event.data}`));
                                $(`#${event.data}`).hasClass('expanded') ? $(`#${event.data}`).removeClass('expanded') : $(`#${event.data}`).addClass('expanded');
                            }).catch(error => error);
                        }
                    }

                    ////////////////
                    //
                    // TODO: Add error messages for non-bug queries and large queries.
                    //
                    ////////////////

                    // Handle clicks for query items.
                    // The handler is attached to the inner <a></a> element instead of the <li></li>
                    // element to avoid cascading the event to the more deeply-nested lists.
                    function queryHandler(event) {

                        // const queryId = $('#' + event.data).attr('id');

                        // RestClient.getClient().getQuery(projectName, queryId, 'Wiql').then(result => {
                        //     if (result.wiql.includes('[System.WorkItemType] = \'Bug\'')) {
                        //         $nonBugQueryError.css('display', 'none');
                        //     } else {
                        //         $nonBugQueryError.css('display', 'block');
                        //     }
                        // }).catch(error => error);

                        // RestClient.getClient().queryById(queryId).then(result => {
                        //     if (result.workItems.length < maximumQuerySize) {
                        //         $largeQueryError.css('display', 'none');
                        //     } else {
                        //         $largeQueryError.css('display', 'block');
                        //     }
                        // }).catch(error => error);

                        $querySelectInput.val($(this).text());
                        $querySelectInput.attr('query-id', $(`#${event.data}`).attr('id'));
                        $titleInput.val($(this).text());
                        $titleInput.trigger('change');
                        $querySelectPopup.removeClass('expanded');
                    }

                    // Retrieve the stored configuration settings for the widget.
                    const settings = JSON.parse(widgetSettings.customSettings.data);

                    // Check for saved individual settings, populating the appropriate HTML elements.
                    if (settings) {
                        if (settings.title) { $titleInput.val(settings.title); }
                        if (settings.queryId) { $querySelectInput.attr('query-id', settings.queryId); }
                        if (settings.queryName) { $querySelectInput.val(settings.queryName); }
                        if (settings.beginWithTriagedDate) { $beginWithTriagedDateRadio.prop('checked', settings.beginWithTriagedDate); }
                        if (settings.beginWithCreatedDate) { $beginWithCreatedDateRadio.prop('checked', settings.beginWithCreatedDate); }
                        if (settings.endWithResolvedDate) { $endWithResolvedDateRadio.prop('checked', settings.endWithResolvedDate); }
                        if (settings.endWithClosedDate) { $endWithClosedDateRadio.prop('checked', settings.endWithClosedDate); }
                        if (settings.columns) {
                            $stateCheckbox.prop('checked', settings.columns.state);
                            $severityCheckbox.prop('checked', settings.columns.severity);
                            $triageCheckbox.prop('checked', settings.columns.triage);
                            $assigneeCheckbox.prop('checked', settings.columns.assignee);
                            $createdDateCheckbox.prop('checked', settings.columns.createdDate);
                            $triagedDateCheckbox.prop('checked', settings.columns.triagedDate);
                            $nearOlaDateCheckbox.prop('checked', settings.columns.nearOlaDate);
                            $pastOlaDateCheckbox.prop('checked', settings.columns.pastOlaDate);
                            $resolvedDateCheckbox.prop('checked', settings.columns.resolvedDate);
                            $closedDateCheckbox.prop('checked', settings.columns.closedDate);
                            $elapsedBusinessDaysCheckbox.prop('checked', settings.columns.elapsedBusinessDays);
                        }
                        if (settings.thresholds) {
                            if (settings.thresholds.critical) {
                                if (settings.thresholds.critical.nearNumber) { $nearCritNumber.val(settings.thresholds.critical.nearNumber); }
                                if (settings.thresholds.critical.nearSelect) { $nearCritSelect.val(settings.thresholds.critical.nearSelect); }
                                if (settings.thresholds.critical.pastNumber) { $pastCritNumber.val(settings.thresholds.critical.pastNumber); }
                                if (settings.thresholds.critical.pastSelect) { $pastCritSelect.val(settings.thresholds.critical.pastSelect); }
                            }
                            if (settings.thresholds.high) {
                                if (settings.thresholds.high.nearNumber) { $nearHighNumber.val(settings.thresholds.high.nearNumber); }
                                if (settings.thresholds.high.nearSelect) { $nearHighSelect.val(settings.thresholds.high.nearSelect); }
                                if (settings.thresholds.high.pastNumber) { $pastHighNumber.val(settings.thresholds.high.pastNumber); }
                                if (settings.thresholds.high.pastSelect) { $pastHighSelect.val(settings.thresholds.high.pastSelect); }
                            }
                            if (settings.thresholds.medium) {
                                if (settings.thresholds.medium.nearNumber) { $nearMedNumber.val(settings.thresholds.medium.nearNumber); }
                                if (settings.thresholds.medium.nearSelect) { $nearMedSelect.val(settings.thresholds.medium.nearSelect); }
                                if (settings.thresholds.medium.pastNumber) { $pastMedNumber.val(settings.thresholds.medium.pastNumber); }
                                if (settings.thresholds.medium.pastSelect) { $pastMedSelect.val(settings.thresholds.medium.pastSelect); }
                            }
                            if (settings.thresholds.low) {
                                if (settings.thresholds.low.nearNumber) { $nearLowNumber.val(settings.thresholds.low.nearNumber); }
                                if (settings.thresholds.low.nearSelect) { $nearLowSelect.val(settings.thresholds.low.nearSelect); }
                                if (settings.thresholds.low.pastNumber) { $pastLowNumber.val(settings.thresholds.low.pastNumber); }
                                if (settings.thresholds.low.pastSelect) { $pastLowSelect.val(settings.thresholds.low.pastSelect); }
                            }
                        }
                    }

                    // Handle changes for the Title and Query inputs. These inputs are bundled
                    // because of how the Query input triggers Title input, and so that the
                    // query link is displayed as expected immediately when a query is selected. 
                    function queryTitleHandler() {
                        let customSettings = {
                            data: JSON.stringify({
                                title: $titleInput.val(),
                                queryId: $querySelectInput.attr('id'),
                                queryName: $querySelectInput.val(),
                            })
                        };
                        let eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                        let eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
                        widgetConfigurationContext.notify(eventName, eventArgs);
                    }

                    // Handle changes for the Columns drop-down. These check boxes are bundled
                    // to enable a live preview of the widget with the selected columns.
                    function columnHandler() {
                        let customSettings = {
                            data: JSON.stringify({
                                columns: {
                                    state: $stateCheckbox.prop('checked'),
                                    severity: $severityCheckbox.prop('checked'),
                                    triage: $triageCheckbox.prop('checked'),
                                    assignee: $assigneeCheckbox.prop('checked'),
                                    createdDate: $createdDateCheckbox.prop('checked'),
                                    triagedDate: $triagedDateCheckbox.prop('checked'),
                                    nearOlaDate: $nearOlaDateCheckbox.prop('checked'),
                                    pastOlaDate: $pastOlaDateCheckbox.prop('checked'),
                                    resolvedDate: $resolvedDateCheckbox.prop('checked'),
                                    closedDate: $closedDateCheckbox.prop('checked'),
                                    elapsedBusinessDays: $elapsedBusinessDaysCheckbox.prop('checked')
                                }
                            })
                        };
                        let eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                        let eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
                        widgetConfigurationContext.notify(eventName, eventArgs);
                    }

                    // Handle changes for input fields, using the passed event data to identify the setting name.
                    function inputHandler(event) {
                        let customSettings = {
                            data: JSON.stringify({
                                [event.data]: $(this).val()
                            })
                        };
                        let eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                        let eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
                        widgetConfigurationContext.notify(eventName, eventArgs);
                    }

                    // Handle changes for radio buttons, using the passed event data to identify the setting name.
                    function booleanHandler(event) {
                        let customSettings = {
                            data: JSON.stringify({
                                [event.data]: $(this).prop('checked')
                            })
                        };
                        let eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                        let eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
                        widgetConfigurationContext.notify(eventName, eventArgs);
                    }

                    // Attach the queryTitleHandler to the Title and Query inputs.
                    $titleInput.on('change', queryTitleHandler);
                    $querySelectInput.on('change', queryTitleHandler);

                    // Attach the columnHandler to the column check boxes.
                    $stateCheckbox.change(columnHandler);
                    $severityCheckbox.change(columnHandler);
                    $triageCheckbox.change(columnHandler);
                    $assigneeCheckbox.change(columnHandler);
                    $createdDateCheckbox.change(columnHandler);
                    $triagedDateCheckbox.change(columnHandler);
                    $nearOlaDateCheckbox.change(columnHandler);
                    $pastOlaDateCheckbox.change(columnHandler);
                    $resolvedDateCheckbox.change(columnHandler);
                    $closedDateCheckbox.change(columnHandler);
                    $elapsedBusinessDaysCheckbox.change(columnHandler);

                    // Attach the booleanHandler to radio buttons, passing the name of the setting
                    // to update as event data.
                    $beginWithTriagedDateRadio.change('beginWithTriagedDate', booleanHandler);
                    $beginWithCreatedDateRadio.change('beginWithCreatedDate', booleanHandler);
                    $endWithResolvedDateRadio.change('endWithResolvedDate', booleanHandler);
                    $endWithClosedDateRadio.change('endWithClosedDate', booleanHandler);

                    // Attach the inputHandler to input fields, passing the name of the setting to
                    // update as event data.
                    $nearCritNumber.change('thresholds.critical.nearNumber', inputHandler);
                    $nearCritSelect.change('thresholds.critical.nearSelect', inputHandler);
                    $nearHighNumber.change('thresholds.high.nearNumber', inputHandler);
                    $nearHighSelect.change('thresholds.high.nearSelect', inputHandler);
                    $nearMedNumber.change('thresholds.medium.nearNumber', inputHandler);
                    $nearMedSelect.change('thresholds.medium.nearSelect', inputHandler);
                    $nearLowNumber.change('thresholds.low.nearNumber', inputHandler);
                    $nearLowSelect.change('thresholds.low.nearSelect', inputHandler);
                    $pastCritNumber.change('thresholds.critical.pastNumber', inputHandler);
                    $pastCritSelect.change('thresholds.critical.pastSelect', inputHandler);
                    $pastHighNumber.change('thresholds.high.pastNumber', inputHandler);
                    $pastHighSelect.change('thresholds.high.pastSelect', inputHandler);
                    $pastMedNumber.change('thresholds.medium.pastNumber', inputHandler);
                    $pastMedSelect.change('thresholds.medium.pastSelect', inputHandler);
                    $pastLowNumber.change('thresholds.low.pastNumber', inputHandler);
                    $pastLowSelect.change('thresholds.low.pastSelect', inputHandler);

                    // Toggle visibility of the Query Select popup when the field or icon is clicked.
                    $querySelectInput.click(event => {
                        event.stopPropagation();
                        $columnSelectPopup.removeClass('expanded');
                        $querySelectPopup.hasClass('expanded') ? $querySelectPopup.removeClass('expanded') : $querySelectPopup.addClass('expanded');
                    });

                    $('span#query-drop-icon').click(event => {
                        event.stopPropagation();
                        $columnSelectPopup.removeClass('expanded');
                        $querySelectPopup.hasClass('expanded') ? $querySelectPopup.removeClass('expanded') : $querySelectPopup.addClass('expanded');
                    });

                    // Toggle visibility of the Column Select popup when the field or icon is clicked.
                    $columnSelectInput.click(event => {
                        event.stopPropagation();
                        $querySelectPopup.removeClass('expanded');
                        $columnSelectPopup.hasClass('expanded') ? $columnSelectPopup.removeClass('expanded') : $columnSelectPopup.addClass('expanded');
                    });

                    $('span#column-drop-icon').click(event => {
                        event.stopPropagation();
                        $querySelectPopup.removeClass('expanded');
                        $columnSelectPopup.hasClass('expanded') ? $columnSelectPopup.removeClass('expanded') : $columnSelectPopup.addClass('expanded');
                    });

                    // Hide the Query Select and Column Select popups when clicking outside either popup.
                    $('div.widget-configuration').click(() => {
                        if ($querySelectPopup.hasClass('expanded')) { $querySelectPopup.removeClass('expanded'); }
                        if ($columnSelectPopup.hasClass('expanded')) { $columnSelectPopup.removeClass('expanded'); }
                    });

                    // Prevent clicks inside the Query Select popup from closing the popup.
                    $('div#query-select-popup').click(event => {
                        event.stopPropagation();
                    });

                    // Prevent clicks inside the Column Select popup from closing the popup.
                    $('div#column-select-popup').click(event => {
                        event.stopPropagation();
                    });

                    return WidgetHelpers.WidgetStatusHelper.Success();

                }).catch(error => error);

            },
            onSave: () => {
                let customSettings = {
                    data: JSON.stringify({
                        title: $titleInput.val(),
                        queryId: $querySelectInput.attr('query-id'),
                        queryName: $querySelectInput.val(),
                        columns: {
                            state: $stateCheckbox.prop('checked'),
                            severity: $severityCheckbox.prop('checked'),
                            triage: $triageCheckbox.prop('checked'),
                            assignee: $assigneeCheckbox.prop('checked'),
                            createdDate: $createdDateCheckbox.prop('checked'),
                            triagedDate: $triagedDateCheckbox.prop('checked'),
                            nearOlaDate: $nearOlaDateCheckbox.prop('checked'),
                            pastOlaDate: $pastOlaDateCheckbox.prop('checked'),
                            resolvedDate: $resolvedDateCheckbox.prop('checked'),
                            closedDate: $closedDateCheckbox.prop('checked'),
                            elapsedBusinessDays: $elapsedBusinessDaysCheckbox.prop('checked')
                        },
                        beginWithTriagedDate: $beginWithTriagedDateRadio.prop('checked'),
                        beginWithCreatedDate: $beginWithCreatedDateRadio.prop('checked'),
                        endWithResolvedDate: $endWithResolvedDateRadio.prop('checked'),
                        endWithClosedDate: $endWithClosedDateRadio.prop('checked'),
                        thresholds: {
                            critical: {
                                nearNumber: $nearCritNumber.val(),
                                nearSelect: $nearCritSelect.val(),
                                pastNumber: $pastCritNumber.val(),
                                pastSelect: $pastCritSelect.val()
                            },
                            high: {
                                nearNumber: $nearHighNumber.val(),
                                nearSelect: $nearHighSelect.val(),
                                pastNumber: $pastHighNumber.val(),
                                pastSelect: $pastHighSelect.val()
                            },
                            medium: {
                                nearNumber: $nearMedNumber.val(),
                                nearSelect: $nearMedSelect.val(),
                                pastNumber: $pastMedNumber.val(),
                                pastSelect: $pastMedSelect.val()
                            },
                            low: {
                                nearNumber: $nearLowNumber.val(),
                                nearSelect: $nearLowSelect.val(),
                                pastNumber: $pastLowNumber.val(),
                                pastSelect: $pastLowSelect.val()
                            }
                        }
                    })
                };
                return WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
            }
        };
    });
    VSS.notifyLoadSucceeded();
});