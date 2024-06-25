(() => {
    "use strict";

    class e {
        constructor(e, t, s) {
            this.eventTarget = e, this.eventName = t, this.eventOptions = s, this.unorderedBindings = new Set
        }

        connect() {
            this.eventTarget.addEventListener(this.eventName, this, this.eventOptions)
        }

        disconnect() {
            this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions)
        }

        bindingConnected(e) {
            this.unorderedBindings.add(e)
        }

        bindingDisconnected(e) {
            this.unorderedBindings.delete(e)
        }

        handleEvent(e) {
            const t = function (e) {
                if ("immediatePropagationStopped" in e) return e;
                {
                    const {stopImmediatePropagation: t} = e;
                    return Object.assign(e, {
                        immediatePropagationStopped: !1, stopImmediatePropagation() {
                            this.immediatePropagationStopped = !0, t.call(this)
                        }
                    })
                }
            }(e);
            for (const e of this.bindings) {
                if (t.immediatePropagationStopped) break;
                e.handleEvent(t)
            }
        }

        hasBindings() {
            return this.unorderedBindings.size > 0
        }

        get bindings() {
            return Array.from(this.unorderedBindings).sort(((e, t) => {
                const s = e.index, r = t.index;
                return s < r ? -1 : s > r ? 1 : 0
            }))
        }
    }

    class t {
        constructor(e) {
            this.application = e, this.eventListenerMaps = new Map, this.started = !1
        }

        start() {
            this.started || (this.started = !0, this.eventListeners.forEach((e => e.connect())))
        }

        stop() {
            this.started && (this.started = !1, this.eventListeners.forEach((e => e.disconnect())))
        }

        get eventListeners() {
            return Array.from(this.eventListenerMaps.values()).reduce(((e, t) => e.concat(Array.from(t.values()))), [])
        }

        bindingConnected(e) {
            this.fetchEventListenerForBinding(e).bindingConnected(e)
        }

        bindingDisconnected(e, t = !1) {
            this.fetchEventListenerForBinding(e).bindingDisconnected(e), t && this.clearEventListenersForBinding(e)
        }

        handleError(e, t, s = {}) {
            this.application.handleError(e, `Error ${t}`, s)
        }

        clearEventListenersForBinding(e) {
            const t = this.fetchEventListenerForBinding(e);
            t.hasBindings() || (t.disconnect(), this.removeMappedEventListenerFor(e))
        }

        removeMappedEventListenerFor(e) {
            const {eventTarget: t, eventName: s, eventOptions: r} = e, n = this.fetchEventListenerMapForEventTarget(t),
                i = this.cacheKey(s, r);
            n.delete(i), 0 == n.size && this.eventListenerMaps.delete(t)
        }

        fetchEventListenerForBinding(e) {
            const {eventTarget: t, eventName: s, eventOptions: r} = e;
            return this.fetchEventListener(t, s, r)
        }

        fetchEventListener(e, t, s) {
            const r = this.fetchEventListenerMapForEventTarget(e), n = this.cacheKey(t, s);
            let i = r.get(n);
            return i || (i = this.createEventListener(e, t, s), r.set(n, i)), i
        }

        createEventListener(t, s, r) {
            const n = new e(t, s, r);
            return this.started && n.connect(), n
        }

        fetchEventListenerMapForEventTarget(e) {
            let t = this.eventListenerMaps.get(e);
            return t || (t = new Map, this.eventListenerMaps.set(e, t)), t
        }

        cacheKey(e, t) {
            const s = [e];
            return Object.keys(t).sort().forEach((e => {
                s.push(`${t[e] ? "" : "!"}${e}`)
            })), s.join(":")
        }
    }

    const s = {
        stop: ({event: e, value: t}) => (t && e.stopPropagation(), !0),
        prevent: ({event: e, value: t}) => (t && e.preventDefault(), !0),
        self: ({event: e, value: t, element: s}) => !t || s === e.target
    }, r = /^(?:(?:([^.]+?)\+)?(.+?)(?:\.(.+?))?(?:@(window|document))?->)?(.+?)(?:#([^:]+?))(?::(.+))?$/;

    function n(e) {
        return e.replace(/(?:[_-])([a-z0-9])/g, ((e, t) => t.toUpperCase()))
    }

    function i(e) {
        return n(e.replace(/--/g, "-").replace(/__/g, "_"))
    }

    function o(e) {
        return e.charAt(0).toUpperCase() + e.slice(1)
    }

    function a(e) {
        return e.replace(/([A-Z])/g, ((e, t) => `-${t.toLowerCase()}`))
    }

    function c(e) {
        return null != e
    }

    function l(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }

    const h = ["meta", "ctrl", "alt", "shift"];

    class u {
        constructor(e, t, s, r) {
            this.element = e, this.index = t, this.eventTarget = s.eventTarget || e, this.eventName = s.eventName || function (e) {
                const t = e.tagName.toLowerCase();
                if (t in d) return d[t](e)
            }(e) || m("missing event name"), this.eventOptions = s.eventOptions || {}, this.identifier = s.identifier || m("missing identifier"), this.methodName = s.methodName || m("missing method name"), this.keyFilter = s.keyFilter || "", this.schema = r
        }

        static forToken(e, t) {
            return new this(e.element, e.index, function (e) {
                const t = e.trim().match(r) || [];
                let s = t[2], n = t[3];
                return n && !["keydown", "keyup", "keypress"].includes(s) && (s += `.${n}`, n = ""), {
                    eventTarget: (i = t[4], "window" == i ? window : "document" == i ? document : void 0),
                    eventName: s,
                    eventOptions: t[7] ? (o = t[7], o.split(":").reduce(((e, t) => Object.assign(e, {[t.replace(/^!/, "")]: !/^!/.test(t)})), {})) : {},
                    identifier: t[5],
                    methodName: t[6],
                    keyFilter: t[1] || n
                };
                var i, o
            }(e.content), t)
        }

        toString() {
            const e = this.keyFilter ? `.${this.keyFilter}` : "",
                t = this.eventTargetName ? `@${this.eventTargetName}` : "";
            return `${this.eventName}${e}${t}->${this.identifier}#${this.methodName}`
        }

        shouldIgnoreKeyboardEvent(e) {
            if (!this.keyFilter) return !1;
            const t = this.keyFilter.split("+");
            if (this.keyFilterDissatisfied(e, t)) return !0;
            const s = t.filter((e => !h.includes(e)))[0];
            return !!s && (l(this.keyMappings, s) || m(`contains unknown key filter: ${this.keyFilter}`), this.keyMappings[s].toLowerCase() !== e.key.toLowerCase())
        }

        shouldIgnoreMouseEvent(e) {
            if (!this.keyFilter) return !1;
            const t = [this.keyFilter];
            return !!this.keyFilterDissatisfied(e, t)
        }

        get params() {
            const e = {}, t = new RegExp(`^data-${this.identifier}-(.+)-param$`, "i");
            for (const {name: s, value: r} of Array.from(this.element.attributes)) {
                const i = s.match(t), o = i && i[1];
                o && (e[n(o)] = g(r))
            }
            return e
        }

        get eventTargetName() {
            return (e = this.eventTarget) == window ? "window" : e == document ? "document" : void 0;
            var e
        }

        get keyMappings() {
            return this.schema.keyMappings
        }

        keyFilterDissatisfied(e, t) {
            const [s, r, n, i] = h.map((e => t.includes(e)));
            return e.metaKey !== s || e.ctrlKey !== r || e.altKey !== n || e.shiftKey !== i
        }
    }

    const d = {
        a: () => "click",
        button: () => "click",
        form: () => "submit",
        details: () => "toggle",
        input: e => "submit" == e.getAttribute("type") ? "click" : "input",
        select: () => "change",
        textarea: () => "input"
    };

    function m(e) {
        throw new Error(e)
    }

    function g(e) {
        try {
            return JSON.parse(e)
        } catch (t) {
            return e
        }
    }

    class p {
        constructor(e, t) {
            this.context = e, this.action = t
        }

        get index() {
            return this.action.index
        }

        get eventTarget() {
            return this.action.eventTarget
        }

        get eventOptions() {
            return this.action.eventOptions
        }

        get identifier() {
            return this.context.identifier
        }

        handleEvent(e) {
            const t = this.prepareActionEvent(e);
            this.willBeInvokedByEvent(e) && this.applyEventModifiers(t) && this.invokeWithEvent(t)
        }

        get eventName() {
            return this.action.eventName
        }

        get method() {
            const e = this.controller[this.methodName];
            if ("function" == typeof e) return e;
            throw new Error(`Action "${this.action}" references undefined method "${this.methodName}"`)
        }

        applyEventModifiers(e) {
            const {element: t} = this.action, {actionDescriptorFilters: s} = this.context.application, {controller: r} = this.context;
            let n = !0;
            for (const [i, o] of Object.entries(this.eventOptions)) if (i in s) {
                const a = s[i];
                n = n && a({name: i, value: o, event: e, element: t, controller: r})
            }
            return n
        }

        prepareActionEvent(e) {
            return Object.assign(e, {params: this.action.params})
        }

        invokeWithEvent(e) {
            const {target: t, currentTarget: s} = e;
            try {
                this.method.call(this.controller, e), this.context.logDebugActivity(this.methodName, {
                    event: e,
                    target: t,
                    currentTarget: s,
                    action: this.methodName
                })
            } catch (t) {
                const {identifier: s, controller: r, element: n, index: i} = this,
                    o = {identifier: s, controller: r, element: n, index: i, event: e};
                this.context.handleError(t, `invoking action "${this.action}"`, o)
            }
        }

        willBeInvokedByEvent(e) {
            const t = e.target;
            return !(e instanceof KeyboardEvent && this.action.shouldIgnoreKeyboardEvent(e)) && !(e instanceof MouseEvent && this.action.shouldIgnoreMouseEvent(e)) && (this.element === t || (t instanceof Element && this.element.contains(t) ? this.scope.containsElement(t) : this.scope.containsElement(this.action.element)))
        }

        get controller() {
            return this.context.controller
        }

        get methodName() {
            return this.action.methodName
        }

        get element() {
            return this.scope.element
        }

        get scope() {
            return this.context.scope
        }
    }

    class f {
        constructor(e, t) {
            this.mutationObserverInit = {
                attributes: !0,
                childList: !0,
                subtree: !0
            }, this.element = e, this.started = !1, this.delegate = t, this.elements = new Set, this.mutationObserver = new MutationObserver((e => this.processMutations(e)))
        }

        start() {
            this.started || (this.started = !0, this.mutationObserver.observe(this.element, this.mutationObserverInit), this.refresh())
        }

        pause(e) {
            this.started && (this.mutationObserver.disconnect(), this.started = !1), e(), this.started || (this.mutationObserver.observe(this.element, this.mutationObserverInit), this.started = !0)
        }

        stop() {
            this.started && (this.mutationObserver.takeRecords(), this.mutationObserver.disconnect(), this.started = !1)
        }

        refresh() {
            if (this.started) {
                const e = new Set(this.matchElementsInTree());
                for (const t of Array.from(this.elements)) e.has(t) || this.removeElement(t);
                for (const t of Array.from(e)) this.addElement(t)
            }
        }

        processMutations(e) {
            if (this.started) for (const t of e) this.processMutation(t)
        }

        processMutation(e) {
            "attributes" == e.type ? this.processAttributeChange(e.target, e.attributeName) : "childList" == e.type && (this.processRemovedNodes(e.removedNodes), this.processAddedNodes(e.addedNodes))
        }

        processAttributeChange(e, t) {
            this.elements.has(e) ? this.delegate.elementAttributeChanged && this.matchElement(e) ? this.delegate.elementAttributeChanged(e, t) : this.removeElement(e) : this.matchElement(e) && this.addElement(e)
        }

        processRemovedNodes(e) {
            for (const t of Array.from(e)) {
                const e = this.elementFromNode(t);
                e && this.processTree(e, this.removeElement)
            }
        }

        processAddedNodes(e) {
            for (const t of Array.from(e)) {
                const e = this.elementFromNode(t);
                e && this.elementIsActive(e) && this.processTree(e, this.addElement)
            }
        }

        matchElement(e) {
            return this.delegate.matchElement(e)
        }

        matchElementsInTree(e = this.element) {
            return this.delegate.matchElementsInTree(e)
        }

        processTree(e, t) {
            for (const s of this.matchElementsInTree(e)) t.call(this, s)
        }

        elementFromNode(e) {
            if (e.nodeType == Node.ELEMENT_NODE) return e
        }

        elementIsActive(e) {
            return e.isConnected == this.element.isConnected && this.element.contains(e)
        }

        addElement(e) {
            this.elements.has(e) || this.elementIsActive(e) && (this.elements.add(e), this.delegate.elementMatched && this.delegate.elementMatched(e))
        }

        removeElement(e) {
            this.elements.has(e) && (this.elements.delete(e), this.delegate.elementUnmatched && this.delegate.elementUnmatched(e))
        }
    }

    class v {
        constructor(e, t, s) {
            this.attributeName = t, this.delegate = s, this.elementObserver = new f(e, this)
        }

        get element() {
            return this.elementObserver.element
        }

        get selector() {
            return `[${this.attributeName}]`
        }

        start() {
            this.elementObserver.start()
        }

        pause(e) {
            this.elementObserver.pause(e)
        }

        stop() {
            this.elementObserver.stop()
        }

        refresh() {
            this.elementObserver.refresh()
        }

        get started() {
            return this.elementObserver.started
        }

        matchElement(e) {
            return e.hasAttribute(this.attributeName)
        }

        matchElementsInTree(e) {
            const t = this.matchElement(e) ? [e] : [], s = Array.from(e.querySelectorAll(this.selector));
            return t.concat(s)
        }

        elementMatched(e) {
            this.delegate.elementMatchedAttribute && this.delegate.elementMatchedAttribute(e, this.attributeName)
        }

        elementUnmatched(e) {
            this.delegate.elementUnmatchedAttribute && this.delegate.elementUnmatchedAttribute(e, this.attributeName)
        }

        elementAttributeChanged(e, t) {
            this.delegate.elementAttributeValueChanged && this.attributeName == t && this.delegate.elementAttributeValueChanged(e, t)
        }
    }

    function b(e, t) {
        let s = e.get(t);
        return s || (s = new Set, e.set(t, s)), s
    }

    class y {
        constructor() {
            this.valuesByKey = new Map
        }

        get keys() {
            return Array.from(this.valuesByKey.keys())
        }

        get values() {
            return Array.from(this.valuesByKey.values()).reduce(((e, t) => e.concat(Array.from(t))), [])
        }

        get size() {
            return Array.from(this.valuesByKey.values()).reduce(((e, t) => e + t.size), 0)
        }

        add(e, t) {
            !function (e, t, s) {
                b(e, t).add(s)
            }(this.valuesByKey, e, t)
        }

        delete(e, t) {
            !function (e, t, s) {
                b(e, t).delete(s), function (e, t) {
                    const s = e.get(t);
                    null != s && 0 == s.size && e.delete(t)
                }(e, t)
            }(this.valuesByKey, e, t)
        }

        has(e, t) {
            const s = this.valuesByKey.get(e);
            return null != s && s.has(t)
        }

        hasKey(e) {
            return this.valuesByKey.has(e)
        }

        hasValue(e) {
            return Array.from(this.valuesByKey.values()).some((t => t.has(e)))
        }

        getValuesForKey(e) {
            const t = this.valuesByKey.get(e);
            return t ? Array.from(t) : []
        }

        getKeysForValue(e) {
            return Array.from(this.valuesByKey).filter((([t, s]) => s.has(e))).map((([e, t]) => e))
        }
    }

    class O {
        constructor(e, t, s, r) {
            this._selector = t, this.details = r, this.elementObserver = new f(e, this), this.delegate = s, this.matchesByElement = new y
        }

        get started() {
            return this.elementObserver.started
        }

        get selector() {
            return this._selector
        }

        set selector(e) {
            this._selector = e, this.refresh()
        }

        start() {
            this.elementObserver.start()
        }

        pause(e) {
            this.elementObserver.pause(e)
        }

        stop() {
            this.elementObserver.stop()
        }

        refresh() {
            this.elementObserver.refresh()
        }

        get element() {
            return this.elementObserver.element
        }

        matchElement(e) {
            const {selector: t} = this;
            if (t) {
                const s = e.matches(t);
                return this.delegate.selectorMatchElement ? s && this.delegate.selectorMatchElement(e, this.details) : s
            }
            return !1
        }

        matchElementsInTree(e) {
            const {selector: t} = this;
            if (t) {
                const s = this.matchElement(e) ? [e] : [],
                    r = Array.from(e.querySelectorAll(t)).filter((e => this.matchElement(e)));
                return s.concat(r)
            }
            return []
        }

        elementMatched(e) {
            const {selector: t} = this;
            t && this.selectorMatched(e, t)
        }

        elementUnmatched(e) {
            const t = this.matchesByElement.getKeysForValue(e);
            for (const s of t) this.selectorUnmatched(e, s)
        }

        elementAttributeChanged(e, t) {
            const {selector: s} = this;
            if (s) {
                const t = this.matchElement(e), r = this.matchesByElement.has(s, e);
                t && !r ? this.selectorMatched(e, s) : !t && r && this.selectorUnmatched(e, s)
            }
        }

        selectorMatched(e, t) {
            this.delegate.selectorMatched(e, t, this.details), this.matchesByElement.add(t, e)
        }

        selectorUnmatched(e, t) {
            this.delegate.selectorUnmatched(e, t, this.details), this.matchesByElement.delete(t, e)
        }
    }

    class E {
        constructor(e, t) {
            this.element = e, this.delegate = t, this.started = !1, this.stringMap = new Map, this.mutationObserver = new MutationObserver((e => this.processMutations(e)))
        }

        start() {
            this.started || (this.started = !0, this.mutationObserver.observe(this.element, {
                attributes: !0,
                attributeOldValue: !0
            }), this.refresh())
        }

        stop() {
            this.started && (this.mutationObserver.takeRecords(), this.mutationObserver.disconnect(), this.started = !1)
        }

        refresh() {
            if (this.started) for (const e of this.knownAttributeNames) this.refreshAttribute(e, null)
        }

        processMutations(e) {
            if (this.started) for (const t of e) this.processMutation(t)
        }

        processMutation(e) {
            const t = e.attributeName;
            t && this.refreshAttribute(t, e.oldValue)
        }

        refreshAttribute(e, t) {
            const s = this.delegate.getStringMapKeyForAttribute(e);
            if (null != s) {
                this.stringMap.has(e) || this.stringMapKeyAdded(s, e);
                const r = this.element.getAttribute(e);
                if (this.stringMap.get(e) != r && this.stringMapValueChanged(r, s, t), null == r) {
                    const t = this.stringMap.get(e);
                    this.stringMap.delete(e), t && this.stringMapKeyRemoved(s, e, t)
                } else this.stringMap.set(e, r)
            }
        }

        stringMapKeyAdded(e, t) {
            this.delegate.stringMapKeyAdded && this.delegate.stringMapKeyAdded(e, t)
        }

        stringMapValueChanged(e, t, s) {
            this.delegate.stringMapValueChanged && this.delegate.stringMapValueChanged(e, t, s)
        }

        stringMapKeyRemoved(e, t, s) {
            this.delegate.stringMapKeyRemoved && this.delegate.stringMapKeyRemoved(e, t, s)
        }

        get knownAttributeNames() {
            return Array.from(new Set(this.currentAttributeNames.concat(this.recordedAttributeNames)))
        }

        get currentAttributeNames() {
            return Array.from(this.element.attributes).map((e => e.name))
        }

        get recordedAttributeNames() {
            return Array.from(this.stringMap.keys())
        }
    }

    class A {
        constructor(e, t, s) {
            this.attributeObserver = new v(e, t, this), this.delegate = s, this.tokensByElement = new y
        }

        get started() {
            return this.attributeObserver.started
        }

        start() {
            this.attributeObserver.start()
        }

        pause(e) {
            this.attributeObserver.pause(e)
        }

        stop() {
            this.attributeObserver.stop()
        }

        refresh() {
            this.attributeObserver.refresh()
        }

        get element() {
            return this.attributeObserver.element
        }

        get attributeName() {
            return this.attributeObserver.attributeName
        }

        elementMatchedAttribute(e) {
            this.tokensMatched(this.readTokensForElement(e))
        }

        elementAttributeValueChanged(e) {
            const [t, s] = this.refreshTokensForElement(e);
            this.tokensUnmatched(t), this.tokensMatched(s)
        }

        elementUnmatchedAttribute(e) {
            this.tokensUnmatched(this.tokensByElement.getValuesForKey(e))
        }

        tokensMatched(e) {
            e.forEach((e => this.tokenMatched(e)))
        }

        tokensUnmatched(e) {
            e.forEach((e => this.tokenUnmatched(e)))
        }

        tokenMatched(e) {
            this.delegate.tokenMatched(e), this.tokensByElement.add(e.element, e)
        }

        tokenUnmatched(e) {
            this.delegate.tokenUnmatched(e), this.tokensByElement.delete(e.element, e)
        }

        refreshTokensForElement(e) {
            const t = this.tokensByElement.getValuesForKey(e), s = this.readTokensForElement(e), r = function (e, t) {
                const s = Math.max(e.length, t.length);
                return Array.from({length: s}, ((s, r) => [e[r], t[r]]))
            }(t, s).findIndex((([e, t]) => {
                return r = t, !((s = e) && r && s.index == r.index && s.content == r.content);
                var s, r
            }));
            return -1 == r ? [[], []] : [t.slice(r), s.slice(r)]
        }

        readTokensForElement(e) {
            const t = this.attributeName;
            return function (e, t, s) {
                return e.trim().split(/\s+/).filter((e => e.length)).map(((e, r) => ({
                    element: t,
                    attributeName: s,
                    content: e,
                    index: r
                })))
            }(e.getAttribute(t) || "", e, t)
        }
    }

    class w {
        constructor(e, t, s) {
            this.tokenListObserver = new A(e, t, this), this.delegate = s, this.parseResultsByToken = new WeakMap, this.valuesByTokenByElement = new WeakMap
        }

        get started() {
            return this.tokenListObserver.started
        }

        start() {
            this.tokenListObserver.start()
        }

        stop() {
            this.tokenListObserver.stop()
        }

        refresh() {
            this.tokenListObserver.refresh()
        }

        get element() {
            return this.tokenListObserver.element
        }

        get attributeName() {
            return this.tokenListObserver.attributeName
        }

        tokenMatched(e) {
            const {element: t} = e, {value: s} = this.fetchParseResultForToken(e);
            s && (this.fetchValuesByTokenForElement(t).set(e, s), this.delegate.elementMatchedValue(t, s))
        }

        tokenUnmatched(e) {
            const {element: t} = e, {value: s} = this.fetchParseResultForToken(e);
            s && (this.fetchValuesByTokenForElement(t).delete(e), this.delegate.elementUnmatchedValue(t, s))
        }

        fetchParseResultForToken(e) {
            let t = this.parseResultsByToken.get(e);
            return t || (t = this.parseToken(e), this.parseResultsByToken.set(e, t)), t
        }

        fetchValuesByTokenForElement(e) {
            let t = this.valuesByTokenByElement.get(e);
            return t || (t = new Map, this.valuesByTokenByElement.set(e, t)), t
        }

        parseToken(e) {
            try {
                return {value: this.delegate.parseValueForToken(e)}
            } catch (e) {
                return {error: e}
            }
        }
    }

    class k {
        constructor(e, t) {
            this.context = e, this.delegate = t, this.bindingsByAction = new Map
        }

        start() {
            this.valueListObserver || (this.valueListObserver = new w(this.element, this.actionAttribute, this), this.valueListObserver.start())
        }

        stop() {
            this.valueListObserver && (this.valueListObserver.stop(), delete this.valueListObserver, this.disconnectAllActions())
        }

        get element() {
            return this.context.element
        }

        get identifier() {
            return this.context.identifier
        }

        get actionAttribute() {
            return this.schema.actionAttribute
        }

        get schema() {
            return this.context.schema
        }

        get bindings() {
            return Array.from(this.bindingsByAction.values())
        }

        connectAction(e) {
            const t = new p(this.context, e);
            this.bindingsByAction.set(e, t), this.delegate.bindingConnected(t)
        }

        disconnectAction(e) {
            const t = this.bindingsByAction.get(e);
            t && (this.bindingsByAction.delete(e), this.delegate.bindingDisconnected(t))
        }

        disconnectAllActions() {
            this.bindings.forEach((e => this.delegate.bindingDisconnected(e, !0))), this.bindingsByAction.clear()
        }

        parseValueForToken(e) {
            const t = u.forToken(e, this.schema);
            if (t.identifier == this.identifier) return t
        }

        elementMatchedValue(e, t) {
            this.connectAction(t)
        }

        elementUnmatchedValue(e, t) {
            this.disconnectAction(t)
        }
    }

    class M {
        constructor(e, t) {
            this.context = e, this.receiver = t, this.stringMapObserver = new E(this.element, this), this.valueDescriptorMap = this.controller.valueDescriptorMap
        }

        start() {
            this.stringMapObserver.start(), this.invokeChangedCallbacksForDefaultValues()
        }

        stop() {
            this.stringMapObserver.stop()
        }

        get element() {
            return this.context.element
        }

        get controller() {
            return this.context.controller
        }

        getStringMapKeyForAttribute(e) {
            if (e in this.valueDescriptorMap) return this.valueDescriptorMap[e].name
        }

        stringMapKeyAdded(e, t) {
            const s = this.valueDescriptorMap[t];
            this.hasValue(e) || this.invokeChangedCallback(e, s.writer(this.receiver[e]), s.writer(s.defaultValue))
        }

        stringMapValueChanged(e, t, s) {
            const r = this.valueDescriptorNameMap[t];
            null !== e && (null === s && (s = r.writer(r.defaultValue)), this.invokeChangedCallback(t, e, s))
        }

        stringMapKeyRemoved(e, t, s) {
            const r = this.valueDescriptorNameMap[e];
            this.hasValue(e) ? this.invokeChangedCallback(e, r.writer(this.receiver[e]), s) : this.invokeChangedCallback(e, r.writer(r.defaultValue), s)
        }

        invokeChangedCallbacksForDefaultValues() {
            for (const {
                key: e,
                name: t,
                defaultValue: s,
                writer: r
            } of this.valueDescriptors) null == s || this.controller.data.has(e) || this.invokeChangedCallback(t, r(s), void 0)
        }

        invokeChangedCallback(e, t, s) {
            const r = `${e}Changed`, n = this.receiver[r];
            if ("function" == typeof n) {
                const r = this.valueDescriptorNameMap[e];
                try {
                    const e = r.reader(t);
                    let i = s;
                    s && (i = r.reader(s)), n.call(this.receiver, e, i)
                } catch (e) {
                    throw e instanceof TypeError && (e.message = `Stimulus Value "${this.context.identifier}.${r.name}" - ${e.message}`), e
                }
            }
        }

        get valueDescriptors() {
            const {valueDescriptorMap: e} = this;
            return Object.keys(e).map((t => e[t]))
        }

        get valueDescriptorNameMap() {
            const e = {};
            return Object.keys(this.valueDescriptorMap).forEach((t => {
                const s = this.valueDescriptorMap[t];
                e[s.name] = s
            })), e
        }

        hasValue(e) {
            const t = `has${o(this.valueDescriptorNameMap[e].name)}`;
            return this.receiver[t]
        }
    }

    class N {
        constructor(e, t) {
            this.context = e, this.delegate = t, this.targetsByName = new y
        }

        start() {
            this.tokenListObserver || (this.tokenListObserver = new A(this.element, this.attributeName, this), this.tokenListObserver.start())
        }

        stop() {
            this.tokenListObserver && (this.disconnectAllTargets(), this.tokenListObserver.stop(), delete this.tokenListObserver)
        }

        tokenMatched({element: e, content: t}) {
            this.scope.containsElement(e) && this.connectTarget(e, t)
        }

        tokenUnmatched({element: e, content: t}) {
            this.disconnectTarget(e, t)
        }

        connectTarget(e, t) {
            var s;
            this.targetsByName.has(t, e) || (this.targetsByName.add(t, e), null === (s = this.tokenListObserver) || void 0 === s || s.pause((() => this.delegate.targetConnected(e, t))))
        }

        disconnectTarget(e, t) {
            var s;
            this.targetsByName.has(t, e) && (this.targetsByName.delete(t, e), null === (s = this.tokenListObserver) || void 0 === s || s.pause((() => this.delegate.targetDisconnected(e, t))))
        }

        disconnectAllTargets() {
            for (const e of this.targetsByName.keys) for (const t of this.targetsByName.getValuesForKey(e)) this.disconnectTarget(t, e)
        }

        get attributeName() {
            return `data-${this.context.identifier}-target`
        }

        get element() {
            return this.context.element
        }

        get scope() {
            return this.context.scope
        }
    }

    function F(e, t) {
        const s = C(e);
        return Array.from(s.reduce(((e, s) => (function (e, t) {
            const s = e[t];
            return Array.isArray(s) ? s : []
        }(s, t).forEach((t => e.add(t))), e)), new Set))
    }

    function C(e) {
        const t = [];
        for (; e;) t.push(e), e = Object.getPrototypeOf(e);
        return t.reverse()
    }

    class B {
        constructor(e, t) {
            this.started = !1, this.context = e, this.delegate = t, this.outletsByName = new y, this.outletElementsByName = new y, this.selectorObserverMap = new Map, this.attributeObserverMap = new Map
        }

        start() {
            this.started || (this.outletDefinitions.forEach((e => {
                this.setupSelectorObserverForOutlet(e), this.setupAttributeObserverForOutlet(e)
            })), this.started = !0, this.dependentContexts.forEach((e => e.refresh())))
        }

        refresh() {
            this.selectorObserverMap.forEach((e => e.refresh())), this.attributeObserverMap.forEach((e => e.refresh()))
        }

        stop() {
            this.started && (this.started = !1, this.disconnectAllOutlets(), this.stopSelectorObservers(), this.stopAttributeObservers())
        }

        stopSelectorObservers() {
            this.selectorObserverMap.size > 0 && (this.selectorObserverMap.forEach((e => e.stop())), this.selectorObserverMap.clear())
        }

        stopAttributeObservers() {
            this.attributeObserverMap.size > 0 && (this.attributeObserverMap.forEach((e => e.stop())), this.attributeObserverMap.clear())
        }

        selectorMatched(e, t, {outletName: s}) {
            const r = this.getOutlet(e, s);
            r && this.connectOutlet(r, e, s)
        }

        selectorUnmatched(e, t, {outletName: s}) {
            const r = this.getOutletFromMap(e, s);
            r && this.disconnectOutlet(r, e, s)
        }

        selectorMatchElement(e, {outletName: t}) {
            const s = this.selector(t), r = this.hasOutlet(e, t),
                n = e.matches(`[${this.schema.controllerAttribute}~=${t}]`);
            return !!s && r && n && e.matches(s)
        }

        elementMatchedAttribute(e, t) {
            const s = this.getOutletNameFromOutletAttributeName(t);
            s && this.updateSelectorObserverForOutlet(s)
        }

        elementAttributeValueChanged(e, t) {
            const s = this.getOutletNameFromOutletAttributeName(t);
            s && this.updateSelectorObserverForOutlet(s)
        }

        elementUnmatchedAttribute(e, t) {
            const s = this.getOutletNameFromOutletAttributeName(t);
            s && this.updateSelectorObserverForOutlet(s)
        }

        connectOutlet(e, t, s) {
            var r;
            this.outletElementsByName.has(s, t) || (this.outletsByName.add(s, e), this.outletElementsByName.add(s, t), null === (r = this.selectorObserverMap.get(s)) || void 0 === r || r.pause((() => this.delegate.outletConnected(e, t, s))))
        }

        disconnectOutlet(e, t, s) {
            var r;
            this.outletElementsByName.has(s, t) && (this.outletsByName.delete(s, e), this.outletElementsByName.delete(s, t), null === (r = this.selectorObserverMap.get(s)) || void 0 === r || r.pause((() => this.delegate.outletDisconnected(e, t, s))))
        }

        disconnectAllOutlets() {
            for (const e of this.outletElementsByName.keys) for (const t of this.outletElementsByName.getValuesForKey(e)) for (const s of this.outletsByName.getValuesForKey(e)) this.disconnectOutlet(s, t, e)
        }

        updateSelectorObserverForOutlet(e) {
            const t = this.selectorObserverMap.get(e);
            t && (t.selector = this.selector(e))
        }

        setupSelectorObserverForOutlet(e) {
            const t = this.selector(e), s = new O(document.body, t, this, {outletName: e});
            this.selectorObserverMap.set(e, s), s.start()
        }

        setupAttributeObserverForOutlet(e) {
            const t = this.attributeNameForOutletName(e), s = new v(this.scope.element, t, this);
            this.attributeObserverMap.set(e, s), s.start()
        }

        selector(e) {
            return this.scope.outlets.getSelectorForOutletName(e)
        }

        attributeNameForOutletName(e) {
            return this.scope.schema.outletAttributeForScope(this.identifier, e)
        }

        getOutletNameFromOutletAttributeName(e) {
            return this.outletDefinitions.find((t => this.attributeNameForOutletName(t) === e))
        }

        get outletDependencies() {
            const e = new y;
            return this.router.modules.forEach((t => {
                F(t.definition.controllerConstructor, "outlets").forEach((s => e.add(s, t.identifier)))
            })), e
        }

        get outletDefinitions() {
            return this.outletDependencies.getKeysForValue(this.identifier)
        }

        get dependentControllerIdentifiers() {
            return this.outletDependencies.getValuesForKey(this.identifier)
        }

        get dependentContexts() {
            const e = this.dependentControllerIdentifiers;
            return this.router.contexts.filter((t => e.includes(t.identifier)))
        }

        hasOutlet(e, t) {
            return !!this.getOutlet(e, t) || !!this.getOutletFromMap(e, t)
        }

        getOutlet(e, t) {
            return this.application.getControllerForElementAndIdentifier(e, t)
        }

        getOutletFromMap(e, t) {
            return this.outletsByName.getValuesForKey(t).find((t => t.element === e))
        }

        get scope() {
            return this.context.scope
        }

        get schema() {
            return this.context.schema
        }

        get identifier() {
            return this.context.identifier
        }

        get application() {
            return this.context.application
        }

        get router() {
            return this.application.router
        }
    }

    class ${constructor(e,t){this.logDebugActivity=(e,t={}
)=>
    {
        const {identifier: s, controller: r, element: n} = this;
        t = Object.assign({
            identifier: s,
            controller: r,
            element: n
        }, t), this.application.logDebugActivity(this.identifier, e, t)
    }
,
    this.module = e, this.scope = t, this.controller = new e.controllerConstructor(this), this.bindingObserver = new k(this, this.dispatcher), this.valueObserver = new M(this, this.controller), this.targetObserver = new N(this, this), this.outletObserver = new B(this, this);
    try {
        this.controller.initialize(), this.logDebugActivity("initialize")
    } catch (e) {
        this.handleError(e, "initializing controller")
    }
}
connect()
{
    this.bindingObserver.start(), this.valueObserver.start(), this.targetObserver.start(), this.outletObserver.start();
    try {
        this.controller.connect(), this.logDebugActivity("connect")
    } catch (e) {
        this.handleError(e, "connecting controller")
    }
}
refresh()
{
    this.outletObserver.refresh()
}
disconnect()
{
    try {
        this.controller.disconnect(), this.logDebugActivity("disconnect")
    } catch (e) {
        this.handleError(e, "disconnecting controller")
    }
    this.outletObserver.stop(), this.targetObserver.stop(), this.valueObserver.stop(), this.bindingObserver.stop()
}
get
application()
{
    return this.module.application
}
get
identifier()
{
    return this.module.identifier
}
get
schema()
{
    return this.application.schema
}
get
dispatcher()
{
    return this.application.dispatcher
}
get
element()
{
    return this.scope.element
}
get
parentElement()
{
    return this.element.parentElement
}
handleError(e, t, s = {})
{
    const {identifier: r, controller: n, element: i} = this;
    s = Object.assign({identifier: r, controller: n, element: i}, s), this.application.handleError(e, `Error ${t}`, s)
}
targetConnected(e, t)
{
    this.invokeControllerMethod(`${t}TargetConnected`, e)
}
targetDisconnected(e, t)
{
    this.invokeControllerMethod(`${t}TargetDisconnected`, e)
}
outletConnected(e, t, s)
{
    this.invokeControllerMethod(`${i(s)}OutletConnected`, e, t)
}
outletDisconnected(e, t, s)
{
    this.invokeControllerMethod(`${i(s)}OutletDisconnected`, e, t)
}
invokeControllerMethod(e, ...t)
{
    const s = this.controller;
    "function" == typeof s[e] && s[e](...t)
}
}
const T = "function" == typeof Object.getOwnPropertySymbols ? e => [...Object.getOwnPropertyNames(e), ...Object.getOwnPropertySymbols(e)] : Object.getOwnPropertyNames,
    S = (() => {
        function e(e) {
            function t() {
                return Reflect.construct(e, arguments, new.target)
            }

            return t.prototype = Object.create(e.prototype, {constructor: {value: t}}), Reflect.setPrototypeOf(t, e), t
        }

        try {
            return function () {
                const t = e((function () {
                    this.a.call(this)
                }));
                t.prototype.a = function () {
                }, new t
            }(), e
        } catch (e) {
            return e => class extends e {
            }
        }
    })();

class L {
    constructor(e, t) {
        this.application = e, this.definition = function (e) {
            return {
                identifier: e.identifier, controllerConstructor: (t = e.controllerConstructor, function (e, t) {
                    const s = S(e), r = function (e, t) {
                        return T(t).reduce(((s, r) => {
                            const n = function (e, t, s) {
                                const r = Object.getOwnPropertyDescriptor(e, s);
                                if (!r || !("value" in r)) {
                                    const e = Object.getOwnPropertyDescriptor(t, s).value;
                                    return r && (e.get = r.get || e.get, e.set = r.set || e.set), e
                                }
                            }(e, t, r);
                            return n && Object.assign(s, {[r]: n}), s
                        }), {})
                    }(e.prototype, t);
                    return Object.defineProperties(s.prototype, r), s
                }(t, function (e) {
                    return F(e, "blessings").reduce(((t, s) => {
                        const r = s(e);
                        for (const e in r) {
                            const s = t[e] || {};
                            t[e] = Object.assign(s, r[e])
                        }
                        return t
                    }), {})
                }(t)))
            };
            var t
        }(t), this.contextsByScope = new WeakMap, this.connectedContexts = new Set
    }

    get identifier() {
        return this.definition.identifier
    }

    get controllerConstructor() {
        return this.definition.controllerConstructor
    }

    get contexts() {
        return Array.from(this.connectedContexts)
    }

    connectContextForScope(e) {
        const t = this.fetchContextForScope(e);
        this.connectedContexts.add(t), t.connect()
    }

    disconnectContextForScope(e) {
        const t = this.contextsByScope.get(e);
        t && (this.connectedContexts.delete(t), t.disconnect())
    }

    fetchContextForScope(e) {
        let t = this.contextsByScope.get(e);
        return t || (t = new $(this, e), this.contextsByScope.set(e, t)), t
    }
}

class x {
    constructor(e) {
        this.scope = e
    }

    has(e) {
        return this.data.has(this.getDataKey(e))
    }

    get(e) {
        return this.getAll(e)[0]
    }

    getAll(e) {
        return (this.data.get(this.getDataKey(e)) || "").match(/[^\s]+/g) || []
    }

    getAttributeName(e) {
        return this.data.getAttributeNameForKey(this.getDataKey(e))
    }

    getDataKey(e) {
        return `${e}-class`
    }

    get data() {
        return this.scope.data
    }
}

class D {
    constructor(e) {
        this.scope = e
    }

    get element() {
        return this.scope.element
    }

    get identifier() {
        return this.scope.identifier
    }

    get(e) {
        const t = this.getAttributeNameForKey(e);
        return this.element.getAttribute(t)
    }

    set(e, t) {
        const s = this.getAttributeNameForKey(e);
        return this.element.setAttribute(s, t), this.get(e)
    }

    has(e) {
        const t = this.getAttributeNameForKey(e);
        return this.element.hasAttribute(t)
    }

    delete(e) {
        if (this.has(e)) {
            const t = this.getAttributeNameForKey(e);
            return this.element.removeAttribute(t), !0
        }
        return !1
    }

    getAttributeNameForKey(e) {
        return `data-${this.identifier}-${a(e)}`
    }
}

class K {
    constructor(e) {
        this.warnedKeysByObject = new WeakMap, this.logger = e
    }

    warn(e, t, s) {
        let r = this.warnedKeysByObject.get(e);
        r || (r = new Set, this.warnedKeysByObject.set(e, r)), r.has(t) || (r.add(t), this.logger.warn(s, e))
    }
}

function I(e, t) {
    return `[${e}~="${t}"]`
}

class V {
    constructor(e) {
        this.scope = e
    }

    get element() {
        return this.scope.element
    }

    get identifier() {
        return this.scope.identifier
    }

    get schema() {
        return this.scope.schema
    }

    has(e) {
        return null != this.find(e)
    }

    find(...e) {
        return e.reduce(((e, t) => e || this.findTarget(t) || this.findLegacyTarget(t)), void 0)
    }

    findAll(...e) {
        return e.reduce(((e, t) => [...e, ...this.findAllTargets(t), ...this.findAllLegacyTargets(t)]), [])
    }

    findTarget(e) {
        const t = this.getSelectorForTargetName(e);
        return this.scope.findElement(t)
    }

    findAllTargets(e) {
        const t = this.getSelectorForTargetName(e);
        return this.scope.findAllElements(t)
    }

    getSelectorForTargetName(e) {
        return I(this.schema.targetAttributeForScope(this.identifier), e)
    }

    findLegacyTarget(e) {
        const t = this.getLegacySelectorForTargetName(e);
        return this.deprecate(this.scope.findElement(t), e)
    }

    findAllLegacyTargets(e) {
        const t = this.getLegacySelectorForTargetName(e);
        return this.scope.findAllElements(t).map((t => this.deprecate(t, e)))
    }

    getLegacySelectorForTargetName(e) {
        const t = `${this.identifier}.${e}`;
        return I(this.schema.targetAttribute, t)
    }

    deprecate(e, t) {
        if (e) {
            const {identifier: s} = this, r = this.schema.targetAttribute, n = this.schema.targetAttributeForScope(s);
            this.guide.warn(e, `target:${t}`, `Please replace ${r}="${s}.${t}" with ${n}="${t}". The ${r} attribute is deprecated and will be removed in a future version of Stimulus.`)
        }
        return e
    }

    get guide() {
        return this.scope.guide
    }
}

class j {
    constructor(e, t) {
        this.scope = e, this.controllerElement = t
    }

    get element() {
        return this.scope.element
    }

    get identifier() {
        return this.scope.identifier
    }

    get schema() {
        return this.scope.schema
    }

    has(e) {
        return null != this.find(e)
    }

    find(...e) {
        return e.reduce(((e, t) => e || this.findOutlet(t)), void 0)
    }

    findAll(...e) {
        return e.reduce(((e, t) => [...e, ...this.findAllOutlets(t)]), [])
    }

    getSelectorForOutletName(e) {
        const t = this.schema.outletAttributeForScope(this.identifier, e);
        return this.controllerElement.getAttribute(t)
    }

    findOutlet(e) {
        const t = this.getSelectorForOutletName(e);
        if (t) return this.findElement(t, e)
    }

    findAllOutlets(e) {
        const t = this.getSelectorForOutletName(e);
        return t ? this.findAllElements(t, e) : []
    }

    findElement(e, t) {
        return this.scope.queryElements(e).filter((s => this.matchesElement(s, e, t)))[0]
    }

    findAllElements(e, t) {
        return this.scope.queryElements(e).filter((s => this.matchesElement(s, e, t)))
    }

    matchesElement(e, t, s) {
        const r = e.getAttribute(this.scope.schema.controllerAttribute) || "";
        return e.matches(t) && r.split(" ").includes(s)
    }
}

class U {
    constructor(e, t, s, r) {
        this.targets = new V(this), this.classes = new x(this), this.data = new D(this), this.containsElement = e => e.closest(this.controllerSelector) === this.element, this.schema = e, this.element = t, this.identifier = s, this.guide = new K(r), this.outlets = new j(this.documentScope, t)
    }

    findElement(e) {
        return this.element.matches(e) ? this.element : this.queryElements(e).find(this.containsElement)
    }

    findAllElements(e) {
        return [...this.element.matches(e) ? [this.element] : [], ...this.queryElements(e).filter(this.containsElement)]
    }

    queryElements(e) {
        return Array.from(this.element.querySelectorAll(e))
    }

    get controllerSelector() {
        return I(this.schema.controllerAttribute, this.identifier)
    }

    get isDocumentScope() {
        return this.element === document.documentElement
    }

    get documentScope() {
        return this.isDocumentScope ? this : new U(this.schema, document.documentElement, this.identifier, this.guide.logger)
    }
}

class P {
    constructor(e, t, s) {
        this.element = e, this.schema = t, this.delegate = s, this.valueListObserver = new w(this.element, this.controllerAttribute, this), this.scopesByIdentifierByElement = new WeakMap, this.scopeReferenceCounts = new WeakMap
    }

    start() {
        this.valueListObserver.start()
    }

    stop() {
        this.valueListObserver.stop()
    }

    get controllerAttribute() {
        return this.schema.controllerAttribute
    }

    parseValueForToken(e) {
        const {element: t, content: s} = e;
        return this.parseValueForElementAndIdentifier(t, s)
    }

    parseValueForElementAndIdentifier(e, t) {
        const s = this.fetchScopesByIdentifierForElement(e);
        let r = s.get(t);
        return r || (r = this.delegate.createScopeForElementAndIdentifier(e, t), s.set(t, r)), r
    }

    elementMatchedValue(e, t) {
        const s = (this.scopeReferenceCounts.get(t) || 0) + 1;
        this.scopeReferenceCounts.set(t, s), 1 == s && this.delegate.scopeConnected(t)
    }

    elementUnmatchedValue(e, t) {
        const s = this.scopeReferenceCounts.get(t);
        s && (this.scopeReferenceCounts.set(t, s - 1), 1 == s && this.delegate.scopeDisconnected(t))
    }

    fetchScopesByIdentifierForElement(e) {
        let t = this.scopesByIdentifierByElement.get(e);
        return t || (t = new Map, this.scopesByIdentifierByElement.set(e, t)), t
    }
}

class R {
    constructor(e) {
        this.application = e, this.scopeObserver = new P(this.element, this.schema, this), this.scopesByIdentifier = new y, this.modulesByIdentifier = new Map
    }

    get element() {
        return this.application.element
    }

    get schema() {
        return this.application.schema
    }

    get logger() {
        return this.application.logger
    }

    get controllerAttribute() {
        return this.schema.controllerAttribute
    }

    get modules() {
        return Array.from(this.modulesByIdentifier.values())
    }

    get contexts() {
        return this.modules.reduce(((e, t) => e.concat(t.contexts)), [])
    }

    start() {
        this.scopeObserver.start()
    }

    stop() {
        this.scopeObserver.stop()
    }

    loadDefinition(e) {
        this.unloadIdentifier(e.identifier);
        const t = new L(this.application, e);
        this.connectModule(t);
        const s = e.controllerConstructor.afterLoad;
        s && s.call(e.controllerConstructor, e.identifier, this.application)
    }

    unloadIdentifier(e) {
        const t = this.modulesByIdentifier.get(e);
        t && this.disconnectModule(t)
    }

    getContextForElementAndIdentifier(e, t) {
        const s = this.modulesByIdentifier.get(t);
        if (s) return s.contexts.find((t => t.element == e))
    }

    proposeToConnectScopeForElementAndIdentifier(e, t) {
        const s = this.scopeObserver.parseValueForElementAndIdentifier(e, t);
        s ? this.scopeObserver.elementMatchedValue(s.element, s) : console.error(`Couldn't find or create scope for identifier: "${t}" and element:`, e)
    }

    handleError(e, t, s) {
        this.application.handleError(e, t, s)
    }

    createScopeForElementAndIdentifier(e, t) {
        return new U(this.schema, e, t, this.logger)
    }

    scopeConnected(e) {
        this.scopesByIdentifier.add(e.identifier, e);
        const t = this.modulesByIdentifier.get(e.identifier);
        t && t.connectContextForScope(e)
    }

    scopeDisconnected(e) {
        this.scopesByIdentifier.delete(e.identifier, e);
        const t = this.modulesByIdentifier.get(e.identifier);
        t && t.disconnectContextForScope(e)
    }

    connectModule(e) {
        this.modulesByIdentifier.set(e.identifier, e), this.scopesByIdentifier.getValuesForKey(e.identifier).forEach((t => e.connectContextForScope(t)))
    }

    disconnectModule(e) {
        this.modulesByIdentifier.delete(e.identifier), this.scopesByIdentifier.getValuesForKey(e.identifier).forEach((t => e.disconnectContextForScope(t)))
    }
}

const q = {
    controllerAttribute: "data-controller",
    actionAttribute: "data-action",
    targetAttribute: "data-target",
    targetAttributeForScope: e => `data-${e}-target`,
    outletAttributeForScope: (e, t) => `data-${e}-${t}-outlet`,
    keyMappings: Object.assign(Object.assign({
        enter: "Enter",
        tab: "Tab",
        esc: "Escape",
        space: " ",
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        home: "Home",
        end: "End",
        page_up: "PageUp",
        page_down: "PageDown"
    }, z("abcdefghijklmnopqrstuvwxyz".split("").map((e => [e, e])))), z("0123456789".split("").map((e => [e, e]))))
};

function z(e) {
    return e.reduce(((e, [t, s]) => Object.assign(Object.assign({}, e), {[t]: s})), {})
}

function _(e, t, s) {
    return e.application.getControllerForElementAndIdentifier(t, s)
}

function W(e, t, s) {
    let r = _(e, t, s);
    return r || (e.application.router.proposeToConnectScopeForElementAndIdentifier(t, s), r = _(e, t, s), r || void 0)
}

function J([e, t], s) {
    return function (e) {
        const {token: t, typeDefinition: s} = e, r = `${a(t)}-value`, i = function (e) {
            const {controller: t, token: s, typeDefinition: r} = e, n = function (e) {
                const {controller: t, token: s, typeObject: r} = e, n = c(r.type), i = c(r.default), o = n && i,
                    a = n && !i, l = !n && i, h = H(r.type), u = Z(e.typeObject.default);
                if (a) return h;
                if (l) return u;
                if (h !== u) throw new Error(`The specified default value for the Stimulus Value "${t ? `${t}.${s}` : s}" must match the defined type "${h}". The provided default value of "${r.default}" is of type "${u}".`);
                return o ? h : void 0
            }({controller: t, token: s, typeObject: r}), i = Z(r), o = H(r), a = n || i || o;
            if (a) return a;
            throw new Error(`Unknown value type "${t ? `${t}.${r}` : s}" for "${s}" value`)
        }(e);
        return {
            type: i, key: r, name: n(r), get defaultValue() {
                return function (e) {
                    const t = H(e);
                    if (t) return G[t];
                    const s = l(e, "default"), r = l(e, "type"), n = e;
                    if (s) return n.default;
                    if (r) {
                        const {type: e} = n, t = H(e);
                        if (t) return G[t]
                    }
                    return e
                }(s)
            }, get hasCustomDefaultValue() {
                return void 0 !== Z(s)
            }, reader: Q[i], writer: X[i] || X.default
        }
    }({controller: s, token: e, typeDefinition: t})
}

function H(e) {
    switch (e) {
        case Array:
            return "array";
        case Boolean:
            return "boolean";
        case Number:
            return "number";
        case Object:
            return "object";
        case String:
            return "string"
    }
}

function Z(e) {
    switch (typeof e) {
        case"boolean":
            return "boolean";
        case"number":
            return "number";
        case"string":
            return "string"
    }
    return Array.isArray(e) ? "array" : "[object Object]" === Object.prototype.toString.call(e) ? "object" : void 0
}

const G = {
    get array() {
        return []
    }, boolean: !1, number: 0, get object() {
        return {}
    }, string: ""
}, Q = {
    array(e) {
        const t = JSON.parse(e);
        if (!Array.isArray(t)) throw new TypeError(`expected value of type "array" but instead got value "${e}" of type "${Z(t)}"`);
        return t
    },
    boolean: e => !("0" == e || "false" == String(e).toLowerCase()),
    number: e => Number(e.replace(/_/g, "")),
    object(e) {
        const t = JSON.parse(e);
        if (null === t || "object" != typeof t || Array.isArray(t)) throw new TypeError(`expected value of type "object" but instead got value "${e}" of type "${Z(t)}"`);
        return t
    },
    string: e => e
}, X = {
    default: function (e) {
        return `${e}`
    }, array: Y, object: Y
};

function Y(e) {
    return JSON.stringify(e)
}

class ee {
    constructor(e) {
        this.context = e
    }

    static get shouldLoad() {
        return !0
    }

    static afterLoad(e, t) {
    }

    get application() {
        return this.context.application
    }

    get scope() {
        return this.context.scope
    }

    get element() {
        return this.scope.element
    }

    get identifier() {
        return this.scope.identifier
    }

    get targets() {
        return this.scope.targets
    }

    get outlets() {
        return this.scope.outlets
    }

    get classes() {
        return this.scope.classes
    }

    get data() {
        return this.scope.data
    }

    initialize() {
    }

    connect() {
    }

    disconnect() {
    }

    dispatch(e, {
        target: t = this.element,
        detail: s = {},
        prefix: r = this.identifier,
        bubbles: n = !0,
        cancelable: i = !0
    } = {}) {
        const o = new CustomEvent(r ? `${r}:${e}` : e, {detail: s, bubbles: n, cancelable: i});
        return t.dispatchEvent(o), o
    }
}

ee.blessings = [function (e) {
    return F(e, "classes").reduce(((e, t) => {
        return Object.assign(e, {
            [`${s = t}Class`]: {
                get() {
                    const {classes: e} = this;
                    if (e.has(s)) return e.get(s);
                    {
                        const t = e.getAttributeName(s);
                        throw new Error(`Missing attribute "${t}"`)
                    }
                }
            }, [`${s}Classes`]: {
                get() {
                    return this.classes.getAll(s)
                }
            }, [`has${o(s)}Class`]: {
                get() {
                    return this.classes.has(s)
                }
            }
        });
        var s
    }), {})
}, function (e) {
    return F(e, "targets").reduce(((e, t) => {
        return Object.assign(e, {
            [`${s = t}Target`]: {
                get() {
                    const e = this.targets.find(s);
                    if (e) return e;
                    throw new Error(`Missing target element "${s}" for "${this.identifier}" controller`)
                }
            }, [`${s}Targets`]: {
                get() {
                    return this.targets.findAll(s)
                }
            }, [`has${o(s)}Target`]: {
                get() {
                    return this.targets.has(s)
                }
            }
        });
        var s
    }), {})
}, function (e) {
    const t = function (e, t) {
        return C(e).reduce(((e, s) => (e.push(...function (e, t) {
            const s = e[t];
            return s ? Object.keys(s).map((e => [e, s[e]])) : []
        }(s, t)), e)), [])
    }(e, "values"), s = {
        valueDescriptorMap: {
            get() {
                return t.reduce(((e, t) => {
                    const s = J(t, this.identifier), r = this.data.getAttributeNameForKey(s.key);
                    return Object.assign(e, {[r]: s})
                }), {})
            }
        }
    };
    return t.reduce(((e, t) => Object.assign(e, function (e, t) {
        const s = J(e, void 0), {key: r, name: n, reader: i, writer: a} = s;
        return {
            [n]: {
                get() {
                    const e = this.data.get(r);
                    return null !== e ? i(e) : s.defaultValue
                }, set(e) {
                    void 0 === e ? this.data.delete(r) : this.data.set(r, a(e))
                }
            }, [`has${o(n)}`]: {
                get() {
                    return this.data.has(r) || s.hasCustomDefaultValue
                }
            }
        }
    }(t))), s)
}, function (e) {
    return F(e, "outlets").reduce(((e, t) => Object.assign(e, function (e) {
        const t = i(e);
        return {
            [`${t}Outlet`]: {
                get() {
                    const t = this.outlets.find(e), s = this.outlets.getSelectorForOutletName(e);
                    if (t) {
                        const s = W(this, t, e);
                        if (s) return s;
                        throw new Error(`The provided outlet element is missing an outlet controller "${e}" instance for host controller "${this.identifier}"`)
                    }
                    throw new Error(`Missing outlet element "${e}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${s}".`)
                }
            }, [`${t}Outlets`]: {
                get() {
                    const t = this.outlets.findAll(e);
                    return t.length > 0 ? t.map((t => {
                        const s = W(this, t, e);
                        if (s) return s;
                        console.warn(`The provided outlet element is missing an outlet controller "${e}" instance for host controller "${this.identifier}"`, t)
                    })).filter((e => e)) : []
                }
            }, [`${t}OutletElement`]: {
                get() {
                    const t = this.outlets.find(e), s = this.outlets.getSelectorForOutletName(e);
                    if (t) return t;
                    throw new Error(`Missing outlet element "${e}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${s}".`)
                }
            }, [`${t}OutletElements`]: {
                get() {
                    return this.outlets.findAll(e)
                }
            }, [`has${o(t)}Outlet`]: {
                get() {
                    return this.outlets.has(e)
                }
            }
        }
    }(t))), {})
}], ee.targets = [], ee.outlets = [], ee.values = {};

class te extends ee {
    connect() {
        this.hidden = "password" === this.inputTarget.type, this.class = this.hasHiddenClass ? this.hiddenClass : "hidden"
    }

    toggle(e) {
        e.preventDefault(), this.inputTarget.type = this.hidden ? "text" : "password", this.hidden = !this.hidden, this.iconTargets.forEach((e => e.classList.toggle(this.class)))
    }
}

te.targets = ["input", "icon"], te.classes = ["hidden"];
var se = class {
    constructor(e = document.documentElement, r = q) {
        this.logger = console, this.debug = !1, this.logDebugActivity = (e, t, s = {}) => {
            this.debug && this.logFormattedMessage(e, t, s)
        }, this.element = e, this.schema = r, this.dispatcher = new t(this), this.router = new R(this), this.actionDescriptorFilters = Object.assign({}, s)
    }

    static start(e, t) {
        const s = new this(e, t);
        return s.start(), s
    }

    async start() {
        await new Promise((e => {
            "loading" == document.readyState ? document.addEventListener("DOMContentLoaded", (() => e())) : e()
        })), this.logDebugActivity("application", "starting"), this.dispatcher.start(), this.router.start(), this.logDebugActivity("application", "start")
    }

    stop() {
        this.logDebugActivity("application", "stopping"), this.dispatcher.stop(), this.router.stop(), this.logDebugActivity("application", "stop")
    }

    register(e, t) {
        this.load({identifier: e, controllerConstructor: t})
    }

    registerActionOption(e, t) {
        this.actionDescriptorFilters[e] = t
    }

    load(e, ...t) {
        (Array.isArray(e) ? e : [e, ...t]).forEach((e => {
            e.controllerConstructor.shouldLoad && this.router.loadDefinition(e)
        }))
    }

    unload(e, ...t) {
        (Array.isArray(e) ? e : [e, ...t]).forEach((e => this.router.unloadIdentifier(e)))
    }

    get controllers() {
        return this.router.contexts.map((e => e.controller))
    }

    getControllerForElementAndIdentifier(e, t) {
        const s = this.router.getContextForElementAndIdentifier(e, t);
        return s ? s.controller : null
    }

    handleError(e, t, s) {
        var r;
        this.logger.error("%s\n\n%o\n\n%o", t, e, s), null === (r = window.onerror) || void 0 === r || r.call(window, t, "", 0, 0, e)
    }

    logFormattedMessage(e, t, s = {}) {
        s = Object.assign({application: this}, s), this.logger.groupCollapsed(`${e} #${t}`), this.logger.log("details:", Object.assign({}, s)), this.logger.groupEnd()
    }
}.start();
se.register("password-visibility", te), document.addEventListener("DOMContentLoaded", (function () {
    function e(e) {
        var t = document.getElementById("form-password"), s = e.keyCode ? e.keyCode : e.which,
            r = e.shiftKey ? e.shiftKey : 16 === s, n = s >= 65 && s <= 90 && !r || s >= 97 && s <= 122 && r;
        t.classList.toggle("has-warning", n), t.classList.toggle("has-feedback", n), t.querySelector(".form-control-feedback").classList.toggle("hidden", !n), document.querySelector("#passwordStatus").classList.toggle("hidden", !n)
    }

    for (var t = document.getElementsByTagName("input"), s = 0; s < t.length; s++) t[s].addEventListener("keypress", e);
    var r = document.getElementById("login-form");
    r ? r.addEventListener("submit", (function (e) {
        var t = e.target.querySelector("button");
        t && (t.disabled = !0)
    })) : console.error("LoginForm could not be found!");
    var n = document.querySelector("[autofocus]");
    n && n.focus(), function () {
        if (!navigator.cookieEnabled) {
            var e = document.getElementById("disabled-cookies-box");
            if (!e) return void console.error("Cookies not enabled, but warning html element not found.");
            e.classList.remove("hidden")
        }
    }()
})), window.addEventListener("pageshow", (function () {
    var e = document.getElementById("login-form");
    if (e) {
        var t = e.querySelector("button");
        t && (t.disabled = !1)
    }
}))
})
();