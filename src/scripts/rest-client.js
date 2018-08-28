const _ = require('lodash');
const moment = require('moment');
const business = require('moment-business');

VSS.require('TFS/WorkItemTracking/RestClient', restClient => {
    // Set variables to accumulate counts for each OLA Status category.
    let allCount = 0;
    let withinCount = 0;
    let nearCount = 0;
    let pastCount = 0;

    /**
     * Takes a JSON object containing widget configuration settings, and returns a JSON object
     * containing the processed results of the given query, along with the quantities of bugs that
     * fall into each category (all bugs, bugs within OLA, bugs near OLA, and bugs past OLA).
     * 
     * @param {JSON} settings The JSON object representing the widget configuration settings as
     * specified in `config-ola-widget.js`.
     */
    function processQuery(settings) {
        // Reset the counts when reloading the widget.
        allCount = 0;
        withinCount = 0;
        nearCount = 0;
        pastCount = 0;

        let olaStartMetric = null;
        let olaEndMetric = null;

        // Get the OLA start metric from the boolean saved in the configuration settings.
        if (settings.beginWithTriagedDate) {
            olaStartMetric = 'triagedDate';
        } else if (settings.beginWithCreatedDate) {
            olaStartMetric = 'createdDate';
        }

        // Get the OLA end metric from the boolean saved in the configuration settings.
        if (settings.endWithResolvedDate) {
            olaEndMetric = 'resolvedDate';
        } else if (settings.endWithClosedDate) {
            olaEndMetric = 'closedDate';
        }

        return getQueryResults(settings.queryId).then(queryResult => {

            if (queryResult.error) {
                // If our result has been flagged with an error, return the error flag and message.
                return queryResult;
            } else {
                let promiseArray = [];

                allCount = queryResult.length;

                queryResult.forEach(workItem => {
                    promiseArray.push(processWorkItem(workItem.id, olaStartMetric, olaEndMetric, settings.thresholds));
                });

                return Promise.all(promiseArray).then(result => {
                    return {
                        allCount: allCount,
                        withinCount: withinCount,
                        nearCount: nearCount,
                        pastCount: pastCount,
                        data: result
                    };
                }).catch(error => error);
            }
        }).catch(error => error);
    }

    /**
     * Takes a query ID and returns the results of the given query as an array of JSON objects
     * representing work items.
     * 
     * @param {String} queryId The query ID.
     */
    function getQueryResults(queryId) {
        return restClient.getClient().queryById(queryId)
            .then(queryResults => queryResults.workItems)
            .catch(error => {
                // If an error is returned, flag the object we send back and pass the error message.
                return { error: error.message };
            });
    }

    /**
     * Takes a work item ID along with the OLA start metric, the OLA end metric, and the thresholds
     * as specified in the widget configuration settings (`config-ola-widget.js`), and returns an
     * array of JSON objects representing work items, with all required fields set appropriately.
     *  
     * @param {String} workItemId The work item ID.
     * 
     * @param {String} olaStartMetric The metric used to start OLA tracking, either `triagedDate` or
     * `createdDate`.
     * 
     * @param {String} olaEndMetric The metric used to end OLA tracking, either `resolvedDate` or
     * `closedDate`.
     * 
     * @param {JSON} thresholds The threshold metrics and numbers specified for each of the bug
     * severities in the widget configuration settings.
     */
    function processWorkItem(workItemId, olaStartMetric, olaEndMetric, thresholds) {
        return restClient.getClient().getRevisions(workItemId).then(revisions => {
            // Ensure that the work item revisions are properly sorted.
            const sortedRevisions = _.orderBy(revisions, 'rev', 'asc');

            // Filter for the revisions that have the Triage value Triaged.
            const triagedRevisions = _.filter(sortedRevisions, revision => revision.fields['Microsoft.VSTS.Common.Triage'] === 'Triaged');

            // Get the latest revision for populating other fields.
            const latestRevision = sortedRevisions[sortedRevisions.length - 1];

            // Create an object with all appropriate fields set to null (used as a default value if field does not exist).
            let processedWorkItem = {
                id: null,
                title: null,
                severity: null,
                state: null,
                triage: null,
                resolvedReason: null,
                assignedTo: null,
                elapsedBusinessDays: null,
                olaStatus: null,
                dates: {
                    createdDate: null,
                    triagedDate: null,
                    resolvedDate: null,
                    closedDate: null,
                    nearOlaDate: null,
                    pastOlaDate: null
                }
            };

            // Set all fields, either from the REST Client response or from function calls.
            processedWorkItem.id = latestRevision.id ? latestRevision.id : null;
            processedWorkItem.title = latestRevision.fields['System.Title'] ? latestRevision.fields['System.Title'] : null;
            processedWorkItem.severity = latestRevision.fields['Microsoft.VSTS.Common.Severity'] ? latestRevision.fields['Microsoft.VSTS.Common.Severity'] : null;
            processedWorkItem.state = latestRevision.fields['System.State'] ? latestRevision.fields['System.State'] : null;
            processedWorkItem.triage = latestRevision.fields['Microsoft.VSTS.Common.Triage'] ? latestRevision.fields['Microsoft.VSTS.Common.Triage'] : null;
            processedWorkItem.resolvedReason = latestRevision.fields['Microsoft.VSTS.Common.ResolvedReason'] ? latestRevision.fields['Microsoft.VSTS.Common.ResolvedReason'] : null;
            processedWorkItem.assignedTo = latestRevision.fields['System.AssignedTo'] ? latestRevision.fields['System.AssignedTo'] : null;
            processedWorkItem.dates.createdDate = latestRevision.fields['System.CreatedDate'] ? moment.utc(latestRevision.fields['System.CreatedDate']) : null;
            processedWorkItem.dates.triagedDate = triagedRevisions.length > 0 ? moment.utc(triagedRevisions[0].fields['System.ChangedDate']) : null;
            processedWorkItem.dates.resolvedDate = latestRevision.fields['Microsoft.VSTS.Common.ResolvedDate'] ? moment.utc(latestRevision.fields['Microsoft.VSTS.Common.ResolvedDate']) : null;
            processedWorkItem.dates.closedDate = latestRevision.fields['Microsoft.VSTS.Common.ClosedDate'] ? moment.utc(latestRevision.fields['Microsoft.VSTS.Common.ClosedDate']) : null;
            
            deriveOlaDates(olaStartMetric, processedWorkItem.dates, processedWorkItem.severity, thresholds);
            processedWorkItem.elapsedBusinessDays = deriveElapsedBusinessDays(olaEndMetric, processedWorkItem.dates);
            processedWorkItem.olaStatus = deriveOlaStatus(olaEndMetric, processedWorkItem.dates);

            return processedWorkItem;
        }).catch(error => error);
    }

    /**
     * Takes the OLA end metric specified in the widget settings and the JSON object for the work
     * item dates, and returns the number of business days between the beginning of the OLA tracking
     * and the end of the OLA tracking if the bug is not yet resolved or closed (dependant on the
     * OLA end metric chosen). If a bug is resolved or closed, return null.
     * 
     * @param {String} olaEndMetric The metric used to end OLA tracking, either `resolvedDate` or
     * `closedDate`.
     * 
     * @param {JSON} dates The JSON object containing the moments for `createdDate`, `triagedDate`,
     * `nearOlaDate`, `pastOlaDate`, `resolvedDate`, and `closedDate`.
     */
    function deriveElapsedBusinessDays(olaEndMetric, dates) {
        if ((olaEndMetric === 'resolvedDate' && dates.resolvedDate) || (olaEndMetric === 'closedDate' && dates.closedDate)) {
            return null;
        } else {
            return business.weekDays(moment.utc(), dates.pastOlaDate);
        }
    }

    /**
     * Takes the OLA start metric specified in the widget settings, the JSON object for the work
     * item dates, the severity of the work item, and the thresholds specified in the widget
     * settings, and sets `dates.nearOlaDate` and `dates.pastOlaDate` according to the given
     * parameters.
     * 
     * @param {String} olaStartMetric The metric used to start OLA tracking, either `triagedDate` or
     * `createdDate`.
     * 
     * @param {JSON} dates The JSON object containing the moments for `createdDate`, `triagedDate`,
     * `nearOlaDate`, `pastOlaDate`, `resolvedDate`, and `closedDate`.
     * 
     * @param {String} severity The severity of the given work item, either `1 - Critical`,
     * `2 - High`, `3 - Medium`, or `4 - Low`.
     * 
     * @param {JSON} thresholds The threshold metrics and numbers specified for each of the bug
     * severities in the widget configuration settings.
     */
    function deriveOlaDates(olaStartMetric, dates, severity, thresholds) {
        if (olaStartMetric === 'triagedDate' && dates.triagedDate) {
            dates.nearOlaDate = moment.utc(dates.triagedDate);
            dates.pastOlaDate = moment.utc(dates.triagedDate);
        } else if (olaStartMetric === 'createdDate' || (olaStartMetric === 'triagedDate' && !dates.triagedDate)) {
            dates.nearOlaDate = moment.utc(dates.createdDate);
            dates.pastOlaDate = moment.utc(dates.createdDate);
        }

        if (severity === '1 - Critical') {
            addToDate(dates.nearOlaDate, thresholds.critical.nearSelect, thresholds.critical.nearNumber);
            addToDate(dates.pastOlaDate, thresholds.critical.pastSelect, thresholds.critical.pastNumber);
        } else if (severity === '2 - High') {
            addToDate(dates.nearOlaDate, thresholds.high.nearSelect, thresholds.high.nearNumber);
            addToDate(dates.pastOlaDate, thresholds.high.pastSelect, thresholds.high.pastNumber);
        } else if (severity === '3 - Medium') {
            addToDate(dates.nearOlaDate, thresholds.medium.nearSelect, thresholds.medium.nearNumber);
            addToDate(dates.pastOlaDate, thresholds.medium.pastSelect, thresholds.medium.pastNumber);
        } else if (severity === '4 - Low') {
            addToDate(dates.nearOlaDate, thresholds.low.nearSelect, thresholds.low.nearNumber);
            addToDate(dates.pastOlaDate, thresholds.low.pastSelect, thresholds.low.pastNumber);
        }
    }

    /**
     * Takes a moment, a metric to add by, and a number to add and returns the resulting moment.
     * 
     * @param {moment} endMomentUtc The moment to add to.
     * 
     * @param {String} metric The metric to add by, either `hours` or `businessDays`.
     * 
     * @param {Integer} number The number to add.
     */
    function addToDate(endMomentUtc, metric, number) {
        if (metric === 'hours') {
            endMomentUtc.add(number, 'hours');
        } else if (metric === 'businessDays') {
            business.addWeekDays(endMomentUtc, number);
            endMomentUtc.set({ 'hour': 23, 'minute': 59, 'second': 59, 'millisecond': 999 });
        }
    }

    /**
     * Takes the OLA end metric specified in the widget settings and the JSON object for the
     * relevant dates, increments the appropriate category counter, and returns `Within`, `Near`, or
     * `Past` based on the given dates and whether or not the work item is open.
     * 
     * @param {String} olaEndMetric The metric used to end OLA tracking, either `resolvedDate` or
     * `closedDate`.
     * 
     * @param {JSON} dates The JSON object containing the moments for `createdDate`, `triagedDate`,
     * `nearOlaDate`, `pastOlaDate`, `resolvedDate`, and `closedDate`.
     */
    function deriveOlaStatus(olaEndMetric, dates) {
        if (olaEndMetric === 'resolvedDate' && dates.resolvedDate) {
            return getStatusFromDate(dates.resolvedDate);
        } else if (olaEndMetric === 'closedDate' && dates.closedDate) {
            return getStatusFromDate(dates.closedDate);
        } else if (moment.utc() > dates.pastOlaDate) {
            pastCount++;
            return 'Past';
        } else if (moment.utc() > dates.nearOlaDate) {
            nearCount++;
            withinCount++;
            return 'Near';
        } else {
            withinCount++;
            return 'Within';
        }

        function getStatusFromDate(endDate) {
            if (endDate > dates.pastOlaDate) {
                pastCount++;
                return 'Past';
            } else {
                withinCount++;
                return 'Within';
            }
        }
    }

    exports.processQuery = processQuery;
});