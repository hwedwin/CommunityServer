﻿/*
 *
 * (c) Copyright Ascensio System Limited 2010-2016
 *
 * This program is freeware. You can redistribute it and/or modify it under the terms of the GNU 
 * General Public License (GPL) version 3 as published by the Free Software Foundation (https://www.gnu.org/copyleft/gpl.html). 
 * In accordance with Section 7(a) of the GNU GPL its Section 15 shall be amended to the effect that 
 * Ascensio System SIA expressly excludes the warranty of non-infringement of any third-party rights.
 *
 * THIS PROGRAM IS DISTRIBUTED WITHOUT ANY WARRANTY; WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR
 * FITNESS FOR A PARTICULAR PURPOSE. For more details, see GNU GPL at https://www.gnu.org/copyleft/gpl.html
 *
 * You can contact Ascensio System SIA by email at sales@onlyoffice.com
 *
 * The interactive user interfaces in modified source and object code versions of ONLYOFFICE must display 
 * Appropriate Legal Notices, as required under Section 5 of the GNU GPL version 3.
 *
 * Pursuant to Section 7 § 3(b) of the GNU GPL you must retain the original ONLYOFFICE logo which contains 
 * relevant author attributions when distributing the software. If the display of the logo in its graphic 
 * form is not reasonably feasible for technical reasons, you must include the words "Powered by ONLYOFFICE" 
 * in every copy of the program you distribute. 
 * Pursuant to Section 7 § 3(e) we decline to grant you any rights under trademark law for use of our trademarks.
 *
*/


/*******************************************************************************/
if (typeof ASC === "undefined")
    ASC = {};

if (typeof ASC.Projects === "undefined")
    ASC.Projects = {};

ASC.Projects.PageNavigator = (function () {
    var $tableForNavigation = jq("#tableForNavigation"),
        commonPaginationKey = "projectsPagination",
        entryCountOnPage = 0,
        currentPage = 0,
        paginationKey,
        self,
        pgNavigator,
        resources,
        $rowCounter,
        $totalCount = jq("#totalCount"),
        currentObj,
        smallList = [10, 20, 30, 40],
        bigList = [25, 50, 75, 100];

    var init = function (obj, settings) {
        self = this;
        paginationKey = settings.pagination;
        resources = ASC.Projects.Resources.ProjectsJSResource;
        currentObj = obj;

        var currentProjectId = jq.getURLParam('prjID');
        if (currentProjectId) {
            paginationKey += currentProjectId;
        }

        initCounters();

        if (typeof $rowCounter === "undefined") {
            $rowCounter = jq("#countOfRows");
            $rowCounter.advancedSelector({
                    height: 26*4, //magic: itemsCount*itemHeight
                    width: 60,
                    itemsSelectedIds: entryCountOnPage,
                    onechosen: true,
                    showSearch: false,
                    itemsChoose: smallList.concat(bigList).map(function (item) { return { id: item, title: item } }),
                    sortMethod: function() { return 0; }
                })
                .on("showList",
                    function(event, item) {
                        $rowCounter.attr("data-id", item.id).text(item.title).attr("title", item.title);
                        changeCountOfRows(item.id);
                    });
        }

        if (settings.small) {
            $rowCounter.advancedSelector("undisable", smallList);
            $rowCounter.advancedSelector("disable", bigList);
        } else {
            $rowCounter.advancedSelector("undisable", bigList);
            $rowCounter.advancedSelector("disable", smallList);
        }

        $rowCounter.advancedSelector("select", [entryCountOnPage]);
        $rowCounter.attr("data-id", entryCountOnPage).text(entryCountOnPage).attr("title", entryCountOnPage);

        if (typeof self.pgNavigator == "undefined") {
            pgNavigator = new ASC.Controls.PageNavigator.init(
                "ASC.Projects.PageNavigator.pgNavigator", 
                "#divForTaskPager",
                entryCountOnPage,
                parseInt(ASC.Projects.Master.VisiblePageCount),
                currentPage + 1,
                resources.PreviousPage,
                resources.NextPage);
            pgNavigator.NavigatorParent = '#divForTaskPager';
        } else {
            pgNavigator.EntryCountOnPage = entryCountOnPage;
            pgNavigator.CurrentPageNumber = currentPage + 1;
        }
        
        pgNavigator.changePageCallback = function (page) {
            currentPage = page - 1;
            currentObj.getData(true);
            setPaginationData();
        };
        
    };

    function setPaginationData() {
        if (paginationKey && paginationKey !== "") {
            var data = localStorage[commonPaginationKey] ? JSON.parse(localStorage[commonPaginationKey]) : {};
            data[paginationKey] = {
                entryCountOnPage: entryCountOnPage,
                currentPage: currentPage
            };
            localStorage[commonPaginationKey] = JSON.stringify(data);
        }
    };

    function changeCountOfRows (newValue) {
        if (isNaN(newValue)) {
            return;
        }
        if (entryCountOnPage === newValue) return;

        entryCountOnPage = newValue * 1;
        currentPage = 0;
        pgNavigator.EntryCountOnPage = entryCountOnPage;

        currentObj.getData(false);
    };
    
    var update = function (filterCount) {
        $totalCount.text(filterCount);
        pgNavigator.drawPageNavigator(currentPage + 1, filterCount);
        
        setPaginationData();

        if (filterCount) {
            show();
        }
    };

    function initCounters() {
        var data = localStorage[commonPaginationKey] ? JSON.parse(localStorage[commonPaginationKey]) : undefined;
        var pagination;

        if (!data || !data.hasOwnProperty(paginationKey)) {
            pagination = {
                entryCountOnPage: paginationKey === "discussionsKeyForPagination" ? 10 : ASC.Projects.Master.EntryCountOnPage,
                currentPage: 0
            };
        } else {
            pagination = data[paginationKey];
        }

        entryCountOnPage = parseInt(pagination.entryCountOnPage);
        currentPage = parseInt(pagination.currentPage);
    };

    var hide = function() {
        $tableForNavigation.hide();
    };

    function show() {
        $tableForNavigation.show();
    };

    var setMaxPage = function (totalCount) {
        var maxPage = Math.floor(totalCount / entryCountOnPage);

        if (currentPage >= maxPage) {
            currentPage = maxPage - 1;
        }
    };

    var reset = function() {
        currentPage = 0;
    }

    return {
        init: init,
        update: update,
        get entryCountOnPage() {
            return entryCountOnPage;
        },
        get currentPage() {
            return currentPage;
        },
        get pgNavigator() {
            return pgNavigator;
        },
        hide: hide,
        show: show,
        setMaxPage: setMaxPage,
        reset: reset
    };
})();

ASC.Projects.Base = (function () {
    var isFirstLoad = true,
        groupMenu = false,
        loaderTimeOut = -1,
        isInit = false,
        clickBody = "click.body",
        clickEvent = "click",
        entityMenuClass = ".entity-menu",
        withEntityMenuClass = ".with-entity-menu",
        activeClass = "active",
        elementNotFound = "elementNotFound";

    var $filterContainer = jq("#filterContainer"),
        $commonListContainer = jq("#CommonListContainer"),
        $commonPopupContainer = jq("#commonPopupContainer"),
        $loader = jq(".mainPageContent .loader-page"),
        $noContentBlock = jq("#emptyScrCtrlPrj"),
        $groupeMenu = jq("#groupActionContainer"),
        $describePanel,
        $actionPanel,
        $activeEntityMenu;

    var loadingBanner,
        pageNavigator,
        filter,
        resources,
        tasksResource,
        commonResource,
        projectResource,
        milestoneResource,
        timeTrackingResource,
        messageResource,
        templatesResource,
        popup;
    var descriptionPanel = ASC.Projects.DescriptionPanel;
    var eventBinder = ASC.Projects.EventBinder;

    var baseInit = function (settings, pageNavigatorSettings, statusListObject, showEntityMenuHandler, events, dpSetting) {
        initProperties();
        showLoader();
        checkElementNotFound(settings.elementNotFoundError);
        document.title = jq.format("{0} - {1}", settings.moduleTitle, ASC.Projects.Resources.ProjectsJSResource.ProductName);

        if (pageNavigatorSettings) {
            pageNavigator.init(this, pageNavigatorSettings);
        }

        ASC.Projects.StatusList.init(statusListObject, $commonListContainer);
        initActionPanel(showEntityMenuHandler);

        eventBinder.bind(events);

        descriptionPanel.init($commonListContainer, filter, dpSetting);
    }

    function initProperties() {
        if (isInit) return;
        isInit = true;

        loadingBanner = LoadingBanner,
        pageNavigator = ASC.Projects.PageNavigator,
        filter = ASC.Projects.ProjectsAdvansedFilter,
        resources = ASC.Projects.Resources,
        tasksResource = resources.TasksResource,
        commonResource = resources.CommonResource,
        projectResource = resources.ProjectResource,
        milestoneResource = resources.MilestoneResource,
        timeTrackingResource = resources.TimeTrackingResource,
        messageResource = resources.MessageResource,
        templatesResource = resources.ProjectTemplatesResource,
        popup = {
            projectRemoveWarning: createPopupData([projectResource.DeleteProjectPopup, commonResource.PopupNoteUndone], projectResource.DeleteProject, projectResource.DeleteProject),
            taskRemoveWarning: createPopupData([tasksResource.RemoveTaskPopup, commonResource.PopupNoteUndone], tasksResource.RemoveTask, tasksResource.RemoveTask),
            tasksRemoveWarning: createPopupData([tasksResource.RemoveTasksPopup, commonResource.PopupNoteUndone], tasksResource.RemoveTasks, tasksResource.RemoveTasks),
            milestoneRemoveWarning: createPopupData([milestoneResource.DeleteMilestonePopup, commonResource.PopupNoteUndone], milestoneResource.DeleteMilestone, milestoneResource.DeleteMilestone),
            milestonesRemoveWarning: createPopupData([milestoneResource.DeleteMilestonesPopup, commonResource.PopupNoteUndone], milestoneResource.DeleteMilestones, milestoneResource.DeleteMilestones),
            trackingRemoveWarning: createPopupData([timeTrackingResource.DeleteTimersQuestion, commonResource.PopupNoteUndone], timeTrackingResource.DeleteTimers, timeTrackingResource.DeleteTimers),
            discussionRemoveWarning: createPopupData([messageResource.DeleteDiscussionPopup, commonResource.PopupNoteUndone], messageResource.DeleteMessage, messageResource.DeleteMessage),
            projectTemplateRemoveWarning: createPopupData([templatesResource.RemoveQuestion, commonResource.PopupNoteUndone], templatesResource.RemoveTemplateTitlePopup, templatesResource.RemoveTemplateTitlePopup),

            taskLinksRemoveWarning: createPopupData([jq.format(commonResource.TaskMoveNote, "")], commonResource.OneTaskMoveButton, commonResource.MoveTaskHeader),
            taskLinksRemoveDeadlineWarning: createPopupData([jq.format(commonResource.UpdateDeadlineNote, "")], commonResource.TaskUpdateButton, commonResource.UpdateDeadlineHeader),

            closedTaskQuestion: createPopupData([tasksResource.TryingToCloseTheTask, tasksResource.BetterToReturn], tasksResource.EndAllSubtasksCloseTask, tasksResource.ClosingTheTask),
            closedTasksQuestion: createPopupData([tasksResource.TryingToCloseTasks, tasksResource.BetterToReturnTasks], tasksResource.EndAllSubtasksCloseTasks, tasksResource.ClosingTasks),
            projectOpenTaskWarning: createPopupData([projectResource.NotClosePrjWithActiveTasks], projectResource.ViewActiveTasks, projectResource.ViewActiveTasks),
            projectOpenMilestoneWarning: createPopupData([projectResource.NotClosedPrjWithActiveMilestone], projectResource.ViewActiveMilestones, projectResource.CloseProject),
            closeMilestoneWithOpenTasks: createPopupData([milestoneResource.NotCloseMilWithActiveTasks], projectResource.ViewActiveTasks, milestoneResource.CloseMilestone),
            createNewLinkError: createPopupData([tasksResource.ErrorCreateNewLink], projectResource.OkButton, tasksResource.ErrorCreateNewLink)
        };
    };

    function showLoader() {
        if (isFirstLoad) {
            $filterContainer.hide();
            $commonListContainer.hide();
            $loader.show();
        } else {
            if (loaderTimeOut > 0) return;
            loaderTimeOut = setTimeout(function() {
                loadingBanner.displayLoading();
            }, 500);
        }
    };

    var hideLoader = function () {
        if (isFirstLoad) {
            isFirstLoad = false;
            $loader.hide();

            $filterContainer.show();
            if (filter) {
                filter.resize();
            }

            $commonListContainer.show();
        } else {
            if (loaderTimeOut > 0) {
                clearTimeout(loaderTimeOut);
                loaderTimeOut = -1;
            }
            if (!$filterContainer.is(":visible")) {
                $filterContainer.show();
                if (filter) {
                    filter.resize();
                }
            }
            loadingBanner.hideLoading();
        }
    };

    function checkElementNotFound (str) {
        if (location.hash.indexOf(elementNotFound) > 0) {
            ASC.Projects.Common.displayInfoPanel(str, true);
        }
    };

    function setElementNotFound() {
        location.href = location.pathname + "?prjID=" + jq.getURLParam("prjID") + "#" + elementNotFound;
    };

    var showCommonPopup = function (dataKey, okButtonHandler, cancelButtonHandler) {
        initProperties();
        var data = popup[dataKey];

        $commonPopupContainer.html(jq.tmpl("common_containerTmpl",
        {
            options: {
                PopupContainerCssClass: "popupContainerClass",
                OnCancelButtonClick: "PopupKeyUpActionProvider.CloseDialog();",
                IsPopup: true
            },
            header: {
                data: { title: data.header },
                title: "projects_common_popup_header"
            },
            body: {
                data: data,
                title: "projects_commonWarning"
            }
        }));

        $commonPopupContainer.off(clickEvent)
            .on(clickEvent, ".blue", okButtonHandler || function () { jq.unblockUI(); })
            .on(clickEvent, ".gray", cancelButtonHandler || function () { jq.unblockUI(); });

        PopupKeyUpActionProvider.EnterAction = "jq('.commonPopupContent .blue').click();";

        StudioBlockUIManager.blockUI($commonPopupContainer, 400, 200, 0);
    };

    var clearTables = function () {
        descriptionPanel.hide(false);
        if (pageNavigator) {
            pageNavigator.hide();
        }
        jq("#tableListProjects tbody, #milestonesList tbody, .taskList, #discussionsList, #timeSpendsList tbody, [id$='EmptyScreenForFilter'], [id^='emptyList'], .tab, .emptyScrCtrl, #descriptionTab, #descriptionTab > div").hide();
        var $totalTimeText = jq("#totalTimeText");
        if ($totalTimeText.length) {
            $totalTimeText.remove();
        }
        $groupeMenu.hide();
    };

    function showOrHideData(settings, data, filterCount) {
        groupMenu = settings.groupMenu;

        if (pageNavigator && pageNavigator.pgNavigator) {
            pageNavigator.update(filterCount);
        }
        
        if (data.length) {
            $noContentBlock.hide();
            if (typeof filter !== "undefined") {
                filter.show();
            }

            if (groupMenu) {
                ASC.Projects.GroupActionPanel.init(groupMenu, settings.$container);
                $groupeMenu.show();
                $groupeMenu.find(".contentMenu").show();
            }

            settings.$container.html(jq.tmpl(settings.tmplName, data));
            settings.$container.show();

            if (pageNavigator && pageNavigator.pgNavigator) {
                pageNavigator.show();
            }
            hideLoader();

            if (groupMenu) {
                ScrolledGroupMenu.resizeContentHeaderWidth($groupeMenu.find(".contentMenu"));
            }

            return;
        }

        if (filterCount == undefined || filterCount === 0) {
            pageNavigator.hide();

            if (groupMenu) {
                $groupeMenu.hide();
            }

            var emptyScreen;
            if (filter.baseFilter) {
                filter.hide();
                emptyScreen = settings.baseEmptyScreen;
            } else {
                emptyScreen = jq.extend(
                {
                    img: "filter",
                    button: {
                        title: ASC.Projects.Resources.ProjectsFilterResource.ClearFilter,
                        clear: true,
                        canCreate: function() { return true; }
                    }
                }, settings.filterEmptyScreen);
            }

            jq("#emptyScrCtrlPrj").html(jq.tmpl("projects_emptyScreen", emptyScreen)).show();
            jq("#emptyScrCtrlPrj .addFirstElement").off(clickEvent).on(clickEvent, emptyScreen.button.onclick);

            hideLoader();
            return;
        }

        if (pageNavigator && pageNavigator.currentPage >= 0) {
            pageNavigator.setMaxPage(filterCount);
            this.getData();
            return;
        }

        hideLoader();
    };

    function getData(getFunc, success) {
        showLoader();
        this.currentFilter.Count = pageNavigator.entryCountOnPage;
        this.currentFilter.StartIndex = pageNavigator.entryCountOnPage * pageNavigator.currentPage;

        getFunc({}, {
            filter: this.currentFilter,
            success: function () {
                clearTables();
                success.apply(null, arguments);
            }
        });
    };

    function initActionPanel(getActionMenuItems, $container) {
        if (!getActionMenuItems) {
            if ($container) {
                $container.find(entityMenuClass).hide();
            }
            return;
        }

        if (!$container) {
            $container = $commonListContainer;
        }

        $container.on(clickEvent, entityMenuClass, function () {
            if ($actionPanel) {
                jq(entityMenuClass).removeClass(activeClass);
                $actionPanel.remove();
            }
            if (jq(this).is($activeEntityMenu)) {
                $activeEntityMenu = undefined;
                return undefined;
            }

            $activeEntityMenu = jq(this);

            var actionMenuItems = getActionMenuItems.call(this, getSelectedActionCombobox(this));

            $actionPanel = ASC.Projects.Common.createActionPanel($commonListContainer, "actionPanel", actionMenuItems);

            var menuItems = actionMenuItems.menuItems;
            for (var i = menuItems.length - 1; i >= 0; i--) {
                var menuItemHandler = function (menuItem) {
                    return function () {
                        $actionPanel.hide();
                        jq(".studio-action-panel").hide();
                        jq(".entity-menu").removeClass("active");
                        menuItem.handler();
                    };
                }(menuItems[i]);

                jq("#" + menuItems[i].id).on(clickEvent, menuItemHandler);
            }

            return showActionsPanel.call(this);
        });

        $container.on('contextmenu', withEntityMenuClass, function (event) {
            getSelectedActionCombobox(event.target).find(entityMenuClass).click();
            if (!$actionPanel) return true;

            var e = jq.fixEvent(event),
                correctionX = document.body.clientWidth - (e.pageX - pageXOffset + $actionPanel.innerWidth()) > 0 ? 0 : $actionPanel.innerWidth(),
                correctionY = document.body.clientHeight - (e.pageY - pageYOffset + $actionPanel.innerHeight()) > 0 ? 0 : $actionPanel.innerHeight();

            $actionPanel.css({
                top: e.pageY - correctionY,
                left: e.pageX - correctionX
            });

            return false;
        });

        jq('body')
            .off(clickBody + "1")
            .on(clickBody + "1", function (event) {
                setTimeout(function () {
                    var $elt = jq((event.target) ? event.target : event.srcElement);

                    if (!($elt.is(entityMenuClass) || $elt.parents(entityMenuClass).length)) {
                        if ($actionPanel) {
                            $actionPanel.hide();
                        }
                        jq(".menuopen").removeClass("menuopen");
                        jq(entityMenuClass).removeClass(activeClass);
                        $activeEntityMenu = undefined;
                    }

                }, 1);
            });
    };

    function getSelectedActionCombobox(obj) {
        var selectedActionCombobox = jq(obj);
        if (!selectedActionCombobox.is(withEntityMenuClass)) {
            selectedActionCombobox = selectedActionCombobox.parents(withEntityMenuClass);
        }
        return selectedActionCombobox;
    }

    function showActionsPanel() {
        var self = jq(this),
            offset = self.offset(),
            x = offset.left - $actionPanel.outerWidth() + self.outerWidth(true),
            y = calculateTopPosition(offset.top + self.outerHeight(), self);

        $actionPanel.find('.dropdown-item').show();
        self.addClass(activeClass);

        $actionPanel.css({ left: x, top: y }).show();
    };

    function calculateTopPosition(y, self) {
        var panelHeight = $actionPanel.innerHeight(),
            w = jq(window),
            scrScrollTop = w.scrollTop(),
            scrHeight = w.height();

        //$actionPanel.innerHeight() + self.outerHeight() + ($actionPanel.outerHeight() - $actionPanel.innerHeight()
        if (panelHeight < y && scrHeight + scrScrollTop - panelHeight <= y) {
            y = y - $actionPanel.outerHeight();

            if (self) {
                y = y - self.outerHeight();
            }
        }

        return y;
    }

    function unbindEvents() {
        if (typeof $describePanel != "undefined") {
            $describePanel.unbind();
        }
        if (typeof $actionPanel != "undefined") {
            $actionPanel.unbind();
        }
        $commonListContainer.unbind();
        $commonPopupContainer.unbind();
        eventBinder.unbind();
    }

    function createPopupData(notes, okButton, header) {
        return {
            notes: notes,
            okButton: okButton,
            header: header
        }
    }

    return {
        baseInit: baseInit,
        clearTables: clearTables,
        getData: getData,
        showCommonPopup: showCommonPopup,

        $commonListContainer: $commonListContainer,

        showOrHideData: showOrHideData,

        unbindEvents: unbindEvents,
        initActionPanel: initActionPanel,
        setElementNotFound: setElementNotFound
    };
})();