import {test,expect} from '@playwright/test';

test('accessible menu, quick taps, pause isolation, manual, restart and preferences',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Vesper Breakers.'})).toBeVisible();
 await page.getByRole('button',{name:'Sound on'}).click();await page.getByRole('button',{name:'Motion full'}).click();
 await page.reload();await expect(page.getByRole('button',{name:'Sound off'})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Motion reduced'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Launch solo'}).click();await expect(page.locator('#countdown')).toBeHidden({timeout:5000});
 await page.keyboard.press('q');await expect(page.locator('#pilots')).toContainText('BLINK 3s');
 await page.keyboard.press('Escape');await expect(page.getByRole('heading',{name:'Take a breath.'})).toBeVisible();
 const paused=await page.locator('#pilots').innerText();await page.keyboard.press('e');await page.keyboard.press('Space');await page.waitForTimeout(500);expect(await page.locator('#pilots').innerText()).toBe(paused);
 await page.getByRole('button',{name:'Flight manual'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close'}).click();
 await page.getByRole('button',{name:'Resume flight'}).click();await expect(page.locator('#end-panel')).toBeHidden();
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Return to hangar'}).click();await page.getByRole('button',{name:'Local co-op'}).click();
 await expect(page.locator('.pilot-readout')).toHaveCount(2);await expect(page.locator('#pilots')).toContainText('COPPER');expect(errors).toEqual([]);
});

test('mobile solo controls fit and accept concurrent touch input',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.getByRole('button',{name:'Launch solo'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.screenshot({path:'artifacts/mobile-hangar.png',fullPage:true});
 await page.getByRole('button',{name:'Launch solo'}).click();await expect(page.locator('#countdown')).toBeHidden({timeout:5000});
 await expect(page.getByRole('button',{name:'Thrust',exact:true})).toBeVisible();
 // Browser-native pointer dispatch at the DOM input boundary; no simulation state manipulation.
 await page.locator('[data-action=fire]').dispatchEvent('pointerdown',{pointerId:10,pointerType:'touch',bubbles:true});
 await page.locator('[data-action=left]').dispatchEvent('pointerdown',{pointerId:11,pointerType:'touch',bubbles:true});
 await page.waitForTimeout(3000);
 await page.locator('[data-action=fire]').dispatchEvent('pointercancel',{pointerId:10,pointerType:'touch',bubbles:true});
 await page.locator('[data-action=left]').dispatchEvent('pointercancel',{pointerId:11,pointerType:'touch',bubbles:true});
 await expect(page.locator('.pressed')).toHaveCount(0);
 await page.screenshot({path:'artifacts/mobile-flight.png',fullPage:true});
});

test('corrupt save leaves the game playable',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('vesper-breakers-v1','{"solo":-9,"muted":"oops"}'));
 await page.goto('/');await expect(page.locator('#solo-best')).toHaveText('000000');await page.getByRole('button',{name:'Launch solo'}).click();await expect(page.locator('#hud')).toBeVisible();
});

test('real keyboard play scores, clears a sector and persists its record',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Launch solo'}).click();
 await page.keyboard.down('d');await page.keyboard.down('Space');await page.keyboard.down('e');
 await expect(page.locator('#sector')).not.toHaveText('SECTOR 01 / 05',{timeout:90000});
 await page.keyboard.up('d');await page.keyboard.up('Space');await page.keyboard.up('e');
 expect(Number(await page.locator('#score').innerText())).toBeGreaterThan(500);
 await page.keyboard.press('Escape');await page.screenshot({path:'artifacts/desktop-paused.png',fullPage:true});
 await page.getByRole('button',{name:'Return to hangar'}).click();const record=await page.locator('#solo-best').innerText();
 await page.reload();await expect(page.locator('#solo-best')).toHaveText(record);
 await page.screenshot({path:'artifacts/desktop-hangar.png',fullPage:true});
});

 test('unavailable storage does not prevent launch or settings changes',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')};});
 await page.goto('/');await page.getByRole('button',{name:'Sound on'}).click();await page.getByRole('button',{name:'Launch solo'}).click();await expect(page.locator('#hud')).toBeVisible();
 });
