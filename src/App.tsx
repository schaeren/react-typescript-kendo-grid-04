import React, { Component } from 'react';
import './App.css';

import {Grid, GridColumn, GridPageChangeEvent, GridSortSettings, GridSortChangeEvent} from '@progress/kendo-react-grid';
import {GridFilterChangeEvent, GridRowClickEvent, GridItemChangeEvent} from '@progress/kendo-react-grid';
import {Page} from '@progress/kendo-react-grid/dist/npm/paging/Page'; // correct?
import {GridToolbar} from '@progress/kendo-react-grid';
// Used for sorting and filtering grid content
import { orderBy, SortDescriptor, filterBy, CompositeFilterDescriptor, FilterDescriptor} from '@progress/kendo-data-query';
import { ExcelExport } from '@progress/kendo-react-excel-export';
import { GridPDFExport, PDFExport } from '@progress/kendo-react-pdf';

import sampleProducts from './data/products.json';
import { number } from 'prop-types';

interface ProductCategory {
  CategoryID : number,
  CategoryName : string,
  Description : string
}
interface Product {
  ProductID : number,
  ProductName : string,
  SupplierID : number,
  CategoryID : number,
  QuantityPerUnit : string,
  UnitPrice : number,
  UnitsInStock : number,
  UnitsOnOrder : number,
  ReorderLevel : number,
  Discontinued : boolean,
  Category : ProductCategory | null,
  inEditor? : boolean
}

interface AppProps { }
interface AppState {
  products: Product[],
  sort: SortDescriptor[],
  filter: CompositeFilterDescriptor,
  paging: Page,
  productInEditor : number | null  // ID of product currently edited, null if no record is in edited
}

class App extends Component<AppProps, AppState> {
  private appName: string = 'My fourth app with React, TypeScript, KendoReact Grid';
  private _excelExporter: ExcelExport | null = null;
  private _pdfExporter: GridPDFExport | null = null;

  constructor(props: AppProps) {
    super(props);
    this.state = {
      products: sampleProducts,
      sort: [
        {field: 'price', dir: 'asc'} as SortDescriptor
      ],
      filter: { 
        logic: 'and', 
        filters: [
          { 
            field: 'ProductName', 
            operator: 'contains', 
            value: 'j', 
            ignoreCase: true 
          }
        ]  
      },
      paging: {
        skip: 0,
        take: 10
      },
      productInEditor: null
    };
  }

  render() {
    let products = filterBy(this.state.products, this.state.filter);
    products = orderBy(products, this.state.sort);
    products = products.map(p => Object.assign(p, {inEditor: p.ProductID === this.state.productInEditor}));
    const productsCount = products.length;
    const productsForPage = products.slice(this.state.paging.skip, this.state.paging.skip + this.state.paging.take);
    const sortSettings: GridSortSettings = { mode: 'single', allowUnsort: false };
    const isFinishDisabled = this.state.productInEditor == null;

    return (
      <div>
        <h1>{this.appName}</h1>
        <ExcelExport
          ref={(exporter) => { this._excelExporter = exporter; }}
          data={products}
          fileName="MyExcelExport.xlsx"
        >
            <Grid 
              data={productsForPage} 

              onRowClick={(e)=>this.onRowClicked(e)}

              sortable={sortSettings} 
              sort={this.state.sort} 
              onSortChange={(e)=>this.onSortChanged(e)}

              filterable
              filter={this.state.filter}
              onFilterChange={(e)=>this.onFilterChanged(e)}

              pageable={true}
              skip={this.state.paging.skip}
              take={this.state.paging.take}
              total={productsCount}
              onPageChange={(e)=>this.onPageChanged(e)}

              editField="inEditor"
              onItemChange={(e)=>this.onItemChanged(e)}

              resizable
              reorderable
            >
              <GridToolbar>
                <div onClick={(e)=>this.closeEditor(e)}>
                  <button title="Add new" className="k-button k-primary" onClick={()=>this.addProduct()}>Add new</button>
                  <button title="Finish editing" className="k-button k-secondary"  disabled={isFinishDisabled} onClick={()=>this.finishEditing()}>Finish editing</button>
                  <button title="Export to Excel" className="k-button k-primary" onClick={()=>this.exportToExcel()}>Export to Excel</button>
                  <button title="Export to PDF" className="k-button k-primary" onClick={()=>this.exportToPDF()}>Export to PDF</button>
                </div>
              </GridToolbar >
              <GridColumn field="ProductID"    title="Product ID"           filter="numeric" editable={false}/>
              <GridColumn field="ProductName"  title="Product name"/>
              <GridColumn field="UnitPrice"    title="Price" format="{0:c}" filter="numeric" editor="numeric"/>
              <GridColumn field="UnitsInStock" title="Count"                filter="numeric" editor="numeric"/>
            </Grid>
        </ExcelExport>
        <GridPDFExport ref={(element) => { this._pdfExporter = element; }}>
          <Grid
            data={products}
          >
              <GridColumn field="ProductID"    title="Product ID"           filter="numeric" editable={false}/>
              <GridColumn field="ProductName"  title="Product name"/>
              <GridColumn field="UnitPrice"    title="Price" format="{0:c}" filter="numeric" editor="numeric"/>
              <GridColumn field="UnitsInStock" title="Count"                filter="numeric" editor="numeric"/>
          </Grid>
        </GridPDFExport>
      </div>
    );
  }

  // Event handler: Selected a row.
  //
  public onRowClicked(event: GridRowClickEvent): void {
    const product = (event.dataItem != null) ? event.dataItem as Product : null;
    if (product !== null) {
      this.setState({productInEditor: product.ProductID})
      console.log(`Selected ProductId ${product.ProductID}`);
    } else {
      console.log('Selected no product');
    }
  }

  // Event handler: Sorting of a column changed.
  //
  public onSortChanged(event: GridSortChangeEvent): void {
    // Terminate any edit mode
    this.setState({productInEditor: null});

    this.setState({sort : event.sort});
    if (event.sort.length > 0) {
      console.log(`Sort ${event.sort[0].field} ${event.sort[0].dir}`);
    } else {
      console.log('Unsorted');
    }
  }

  // Event handler: Filtering of a column changed.
  //
  public onFilterChanged(event: GridFilterChangeEvent): void {
    // Terminate any edit mode
    this.setState({productInEditor: null});

    this.setState({filter: event.filter});
    if (event.filter != null) {
      console.log(`Filter logical operator: ${event.filter.logic}`);
      for (let fd of event.filter.filters) {
        if ((fd as FilterDescriptor).field) {}
        const fd2: FilterDescriptor = fd as FilterDescriptor;
        console.log(`  ${fd2.field} ${fd2.operator} ${fd2.value}`);
      }  
    }
  }

  // Event handler: Current page changed.
  //
  public onPageChanged(event: GridPageChangeEvent): void {
    console.log(`Page changed: skip=${event.page.skip}, take=${event.page.take}`);
    this.setState({paging: event.page});
  }

  // Event handler: Editing a cell, i.e. content of has changed.
  // 
  public onItemChanged(event: GridItemChangeEvent): void {
    const currentProduct = (event.dataItem != null) ? event.dataItem as Product : null;
    if (currentProduct !== null && event.field !== null) {
      const products = this.state.products;
      const index = products.findIndex(p => p.ProductID === currentProduct.ProductID);
      const editedFieldName = event.field as string;
      // Update value of field currently edited
      products[index] = {...products[index], [editedFieldName]: event.value};
      this.setState({products: products});
    }
  }

  // Event handler: Button 'Add new' clicked -> add a new row.
  //
  public addProduct(): void {
    // Clear filter or we may not see the row for editing the new product!
    this.setState({filter: {logic: 'and', filters: []}});

    const newProduct = this.createNewProduct(this.state.products.length + 1);
    const p = this.state.products.slice();
    p.unshift(newProduct);
    this.setState({
        products: p,
        productInEditor: newProduct.ProductID
    });
  }

  // Event handler: Grid toolbar clicked -> terminate cell edit mode.
  //
  public closeEditor(event: React.MouseEvent<HTMLElement>): void {
    if (event.target === event.currentTarget) {
      this.setState({productInEditor: null})
    }
  }

  // Event handler: Button 'Finish editing' clicked.
  //
  public finishEditing(): void {
    this.setState({productInEditor: null})
  }

  // Event handler: Button 'Export to Excel' clicked.
  //
  private exportToExcel(): void{
    if (this._excelExporter) {
      this._excelExporter.save();
    } 
  }

  // Event handler: Button 'Export to PDF' clicked.
  //
  private exportToPDF(): void{
    if (this._pdfExporter) {
      this._pdfExporter.save();
    } 
  }

  // Create a new product (a new row has been added).
  //
  private createNewProduct(id: number): Product {
    return {
      ProductID : id,
      ProductName : '',
      SupplierID : 0,
      CategoryID : 0,
      QuantityPerUnit : '',
      UnitPrice : 0,
      UnitsInStock : 0,
      UnitsOnOrder : 0,
      ReorderLevel : 0,
      Discontinued : false,
      Category : null,
      inEditor : true
    };
  }
}

export default App;
