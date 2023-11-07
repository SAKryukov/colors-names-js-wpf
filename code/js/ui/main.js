    "use strict";

window.onload = () => {

    const elements = getElements();

    elements.metadata.copyright.textContent = definitionSet.metadata.copyright;
    elements.metadata.version.textContent = definitionSet.metadata.version;
    const cssColorMapMetadata = { source: cssColorNames, map: new Map(), orderIndex: 0, selection: [0, 0], isRemapped: false };
    const wpfColorMapMetadata = { source: wpfColorNames, map: new Map(), orderIndex: 0, selection: [0, 0], isRemapped: false };

    const remap = colorMapMetadata => {
        if (colorMapMetadata.isRemapped) return;
        for (const [key, value] of colorMapMetadata.map) {
            const style = window.getComputedStyle(value);
            const color = conversionSet.parseToRgba(style.backgroundColor);
            colorMapMetadata.map.set(key, { element: value, cssColor: style.backgroundColor, color: color });
        } //loop
        colorMapMetadata.isRemapped = true;
    }; //remap

    let currentCell, tableBody, currentColorMapMetadata;
    let columnFirst = true; //SA???

    const initializeSelection = colorMapMetadata => {
        const row = tableBody.rows[colorMapMetadata.selection[1]];
        const cell = row.cells[colorMapMetadata.selection[0]];
        if (currentCell != null)
            select(currentCell, false);
        select(cell, true);
        currentCell = cell;
    } //initializeSelection

    (() => { //radio events:
        const dataSourceHandler = (event, colorMapMetadata) => {
            if (event.target.checked) {
                populate(colorMapMetadata);
                elements.sort.selectedIndex = colorMapMetadata.orderIndex;
                initializeSelection(colorMapMetadata);
                if (colorMapMetadata.isRemapped) return
                const remapPromise = new Promise(resolve => resolve(colorMapMetadata));
                remapPromise.then(metadata => {
                    remap(metadata);
                });
            } //if
        }; //dataSourceHandler
        elements.radio.css.onchange = event => dataSourceHandler(event, cssColorMapMetadata);
        elements.radio.wpf.onchange = event => dataSourceHandler(event, wpfColorMapMetadata);
    })();

    const select = (cell, doSelect) => {
        if (!cell) return;
        if (doSelect) {
            cell.classList.add(definitionSet.selectionIndicator);
            if (currentColorMapMetadata.isRemapped) {
                const mapValue = currentColorMapMetadata.map.get(cell.title);
                elements.colorResult.value = conversionSet.rgbToCss(cell.title, mapValue.color);
                if (elements.navigationBehavior.background.checked)
                    elements.sample.style.backgroundColor = mapValue.cssColor;
                if (elements.navigationBehavior.foreground.checked)
                    elements.sample.style.color = mapValue.cssColor;
            } //if
            currentColorMapMetadata.selection = [cell.cellIndex, cell.parentElement.rowIndex];
        } else
            cell.classList.remove(definitionSet.selectionIndicator);
    }; //select

    elements.table.onkeydown = event => {
        const moveUp = () => {
            const xIndex = currentCell.cellIndex;
            const currentRow = currentCell.parentElement;
            const yIndex = currentRow.rowIndex;
            if (yIndex < 1) return;
            const newRow = tableBody.rows[yIndex - 1];
            select(currentCell, false);
            currentCell = newRow.cells[xIndex];
            select(currentCell, true);
        }; //moveUp
        const moveDown = () => {
            const xIndex = currentCell.cellIndex;
            const currentRow = currentCell.parentElement;
            const yIndex = currentRow.rowIndex;
            if (yIndex >= tableBody.rows.length - 1) return;
            const newRow = tableBody.rows[yIndex + 1];
            if (xIndex >= newRow.cells.length) return;
            select(currentCell, false);
            currentCell = newRow.cells[xIndex];
            select(currentCell, true);
        }; //moveDown
        const moveLeft = () => {
            const xIndex = currentCell.cellIndex;
            const currentRow = currentCell.parentElement;
            if (xIndex < 1) return;
            select(currentCell, false);
            currentCell = currentRow.cells[xIndex - 1];
            select(currentCell, true);
        }; //moveLeft
        const moveRight = () => {
            const xIndex = currentCell.cellIndex;
            const currentRow = currentCell.parentElement;
            if (xIndex >= currentRow.childNodes.length - 1) return;
            select(currentCell, false);
            currentCell = currentRow.cells[xIndex + 1];
            select(currentCell, true);
        }; //moveRight
        switch (event.key) {
            case definitionSet.keyboard.left:
                moveLeft();
                break;
            case definitionSet.keyboard.right:
                moveRight();
                break;
            case definitionSet.keyboard.up:
                moveUp();
                break;
            case definitionSet.keyboard.down:
                moveDown();
                break;
            default: return;
        } //switch
    } //elements.table.onkeydown

    const populate = colorMapMetadata => {
        const setupCell = (cell, mapIt, color) => {
            cell.title = color;
            cell.onpointerdown = event => {
                select(currentCell, false);
                select(event.target, true);
                currentCell = event.target;
            }; //cell.onpointerdown
            cell.onpointerup = event => {
                if (!event.ctrlKey) return;
                const color = currentColorMapMetadata.map.get(currentCell.title).cssColor;
                if (event.shiftKey)
                    elements.sample.style.color = color;
                else
                    elements.sample.style.backgroundColor = color;
            }; //cell.onpointerup
            const cellContent = document.createElement("div");
            const label = document.createElement("span");
            label.textContent = color;
            const cellSample = document.createElement("div");
            if (mapIt)
                colorMapMetadata.map.set(color, cellSample);
            cellSample.style.backgroundColor = color;
            cellContent.appendChild(cellSample);
            cellContent.appendChild(label);
            cell.appendChild(cellContent);
        } //setupCell
        // populate body
        currentColorMapMetadata = colorMapMetadata;
        const source = colorMapMetadata.source;
        const mapIt = colorMapMetadata.map.size < 1;
        while (elements.table.firstChild)
            elements.table.removeChild(elements.table.firstChild);
        elements.colorCountIndicator.textContent = source.length;
        tableBody = elements.table.createTBody();
        if (columnFirst) {
            const rowCount = source.length / definitionSet.columns;
            for (let index = 0; index < rowCount; ++index) {
                const newRow = document.createElement("tr");
                tableBody.appendChild(newRow);
            } //loop
            let row = tableBody.rows[0];
            for (let color of source) {
                const cell = row.insertCell();
                row = tableBody.rows[
                    row.rowIndex < rowCount - 1 ? row.rowIndex + 1 : 0
                ];
                setupCell(cell, mapIt, color);
            } //loop
        } else {
            let row = document.createElement("tr");
            for (let color of source) {
                if (row.childNodes.length >= definitionSet.columns)
                    row = document.createElement("tr");
                const cell = row.insertCell();
                tableBody.appendChild(row);
                setupCell(cell, mapIt, color);
            } //loop
        } //if
        currentCell = tableBody.rows[0].cells[0];
    }; //populate
    populate(cssColorMapMetadata);

    sortingOrder.setup(elements.sort, (sort, reverse) => {
        orderSet.sort(currentColorMapMetadata, sort, reverse);
        populate(currentColorMapMetadata);
        initializeSelection(currentColorMapMetadata);
    });

    elements.table.tabIndex = 0;
    const focusPromise = new Promise(resolve => resolve(elements.table));
    focusPromise.then(element => {
        remap(cssColorMapMetadata);
        select(currentCell, true);
        element?.focus();
    });

}; //window.onload
