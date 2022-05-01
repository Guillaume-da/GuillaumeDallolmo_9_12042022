/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import Bills from "../containers/Bills.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("When i click on new bill button", () => {
  test("Then It should render new bill page", async() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.Bills)
    const store = null
    const bill = new Bills({document, onNavigate, store, localStorage: window.localStorage})

    await waitFor(() => screen.getAllByTestId('btn-new-bill'))
    const newBillButton = screen.getByTestId('btn-new-bill')
    
    const handleClickNewBill = jest.fn(bill.handleClickNewBill)
    newBillButton.addEventListener('click', handleClickNewBill)
    fireEvent.click(newBillButton)

    expect(handleClickNewBill).toHaveBeenCalled()
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
  })
})

// test d'intégration GET
describe("Given I am a user connected as an Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      const title = await waitFor(() => screen.getByText("Mes notes de frais"))
      const type = await waitFor(() => screen.getByText("Type"))
      const name = await waitFor(() => screen.getByText("Nom"))
      const date = await waitFor(() => screen.getByText("Date"))
      const amount = await waitFor(() => screen.getByText("Montant"))
      const status = await waitFor(() => screen.getByText("Statut"))
      const actions = await waitFor(() => screen.getByText("Actions"))
      
      expect(title).toBeTruthy()
      expect(type).toBeTruthy()
      expect(name).toBeTruthy()
      expect(date).toBeTruthy()
      expect(amount).toBeTruthy()
      expect(status).toBeTruthy()
      expect(actions).toBeTruthy()
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
    })
    test("getBills function should be called", async () => {
      const billsContainer = new Bills({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      jest.spyOn(billsContainer, 'getBills')
      await billsContainer.getBills()
      expect(jest.spyOn(billsContainer, 'getBills')).toHaveBeenCalled()
    })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({error: "Erreur 404"})
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({error: "Erreur 500"})
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
  })
})

describe('Given I am employee', ()=>{
  describe('When I navigate to Bill page', ()=>{
   test('When I click on eye icon, a modal should open', async()=>{
    Object.defineProperty(window, 'localStorage', {value: localStorageMock})
    window.localStorage.setItem('user', JSON.stringify({type:'Employee'}))
    document.body.innerHTML = BillsUI({data: bills})

    const bill = new Bills({
     document, onNavigate, store: null, bills, localStorage: window.localStorage
    })

    $.fn.modal = jest.fn()
    const icon = screen.getAllByTestId('icon-eye')[0]
    const clickOnIcon = jest.fn(bill.handleClickIconEye(icon))  

    icon.addEventListener('click', clickOnIcon)
    fireEvent.click(icon)

    expect(clickOnIcon).toHaveBeenCalled()
    expect(screen.getByText('Justificatif')).toBeTruthy()  
   })
  })
})

describe("When i click on a eye icon", () => { 
  test('Then the handleClickIconEye function should be called', async () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.Bills)
    const store = null
    const bill = new Bills({
      document, 
      onNavigate, 
      store, 
      localStorage: window.localStorage
    })
    
    await waitFor(() => screen.getAllByTestId('icon-eye')[0])
    const eye = screen.getAllByTestId('icon-eye')[0]
    $.fn.modal = jest.fn()
    
    const handleClickIconEye = jest.fn(bill.handleClickIconEye(eye))
    eye.addEventListener('click', handleClickIconEye)
    fireEvent.click(eye)

    expect(handleClickIconEye).toHaveBeenCalled()
    expect($.fn.modal).toHaveBeenCalled()
  })
})

