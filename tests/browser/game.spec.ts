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
 const paused=await page.locator('#pilots').innerText();await page.keyboard.press('e');await page.keyboard.press('f');await page.waitForTimeout(500);expect(await page.locator('#pilots').innerText()).toBe(paused);
 await page.getByRole('button',{name:'Flight manual'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close'}).click();
 await page.getByRole('button',{name:'Resume flight'}).click();await expect(page.locator('#end-panel')).toBeHidden();
 await page.getByRole('button',{name:'Sound off'}).focus();await page.keyboard.press('Space');await expect(page.getByRole('button',{name:'Sound on'})).toBeVisible();
 await page.locator('#pause').focus();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Take a breath.'})).toBeVisible();await page.getByRole('button',{name:'Resume flight'}).click();
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
 // Chromium-native multi-touch input: no simulation state manipulation.
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const fire=await page.locator('[data-action=fire]').boundingBox();const left=await page.locator('[data-action=left]').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fire!.x+fire!.width/2,y:fire!.y+fire!.height/2,id:10},{x:left!.x+left!.width/2,y:left!.y+left!.height/2,id:11}]});
 await expect(page.locator('.pressed')).toHaveCount(2);
 await page.waitForTimeout(3000);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
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
test('touch landscape keeps arena and flight pads together',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const page=await context.newPage();await page.goto('http://127.0.0.1:5180');await page.getByRole('button',{name:'Launch solo'}).click();
 await expect(page.getByRole('button',{name:'Thrust',exact:true})).toBeVisible();
 const pad=await page.locator('.touch-controls').boundingBox();const arena=await page.locator('.arena').boundingBox();
 expect(pad!.y+pad!.height).toBeLessThan(390);expect(arena!.y+arena!.height).toBeLessThan(390);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(844);
 await page.screenshot({path:'artifacts/mobile-landscape.png',fullPage:true});await context.close();
});
